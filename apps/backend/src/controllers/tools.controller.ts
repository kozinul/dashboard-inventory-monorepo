import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';

/**
 * Script ini berfungsi untuk memperbaiki output file JSON yang corrupted atau tidak valid
 * hasil export dari PowerShell.
 */
function autofixJsonString(data: string): any {
    // 1. Memperbaiki wrapper object keys `{"...` menjadi `"...`
    data = data.replace(/\{"/g, '"');
    data = data.replace(/,"/g, '"');

    // 2. Memperbaiki spasi ganda dan colon pada boolean, null, angka
    data = data.replace(/"\s*:\s*:\s*null/gi, '": null');
    data = data.replace(/"\s*:\s*:\s*true/gi, '": true');
    data = data.replace(/"\s*:\s*:\s*false/gi, '": false');
    // Fix Catastrophic Backtracking on \d+(\.\d+)?:
    data = data.replace(/"\s*:\s*:\s*(-?[0-9]+(\.[0-9]+)?)(?=\s*[,}\]])/g, '": $1');

    // 3. Memperbaiki string values dengan `: "` atau `: : "`
    data = data.replace(/"\s*:\s*:\s*"/g, '": "');
    data = data.replace(/"\s*:\s*"/g, '": "');

    // 4. Memperbaiki deklarasi array dan object
    data = data.replace(/"\s*:\s*:\s*\[/g, '": [');
    data = data.replace(/"\s*:\s*\[/g, '": [');
    data = data.replace(/"\s*:\s*:\s*\{/g, '": {');
    data = data.replace(/"\s*:\s*\{/g, '": {');

    // 5. Memperbaiki bracket ganda (PowerShell bugs)
    data = data.replace(/\[\{/g, '{');    // `[{` -> `{`
    data = data.replace(/\}\},/g, '},');  // `}},` -> `},`
    data = data.replace(/\]\],/g, '],');  // `]],` -> `],`
    data = data.replace(/\}\}(\r?\n|$)/g, '}$1'); // `}}` di akhir baris
    data = data.replace(/\]\](\r?\n|$)/g, ']$1'); // `]]` di akhir baris

    // 6. Membersihkan koma-kurung `,{` yang salah penempatan dalam array
    data = data.replace(/,\{/g, '{');

    // Membersihkan koma ganda jika ada
    data = data.replace(/,,/g, ',');

    return JSON.parse(data);
}

/**
 * Convert object to flat key-value pairs horizontally -> vertically
 * e.g. { Name: 'PC', Specs: { RAM: 8 } } ->
 * [ ['Name', 'PC'], ['Specs.RAM', 8] ]
 */
function flattenObjectToVertialRows(ob: any): any[][] {
    var toReturn: any[][] = [];

    function flatHelper(current: any, prop: string) {
        if (Object(current) !== current) {
            // Primitive value
            toReturn.push([prop, current]);
        } else if (Array.isArray(current)) {
            if (current.length === 0) {
                toReturn.push([prop, '[]']);
            } else {
                for (var i = 0, l = current.length; i < l; i++) {
                    flatHelper(current[i], prop + '[' + i + ']');
                }
            }
        } else {
            var isEmpty = true;
            for (var p in current) {
                isEmpty = false;
                // Add dot or ignore if empty prop
                var newProp = prop ? prop + "." + p : p;
                flatHelper(current[p], newProp);
            }
            if (isEmpty && prop) {
                toReturn.push([prop, '{}']);
            }
        }
    }

    flatHelper(ob, '');
    return toReturn;
}

export const convertJsonToExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'Tidak ada file JSON yang diunggah' });
        }

        const wb = XLSX.utils.book_new();
        let successCount = 0;
        let failCount = 0;
        const failedFiles: string[] = [];

        // Add an overview sheet first? We'll just create sheets directly
        for (const file of files) {
            const originalName = file.originalname.replace('.json', '');
            // Sheet name max length is 31 in excel
            let sheetName = originalName.substring(0, 31);

            // Fix invalid characters for sheet name
            sheetName = sheetName.replace(/[\\/?*\[\]]/g, '_');

            // Handle duplicate sheet names
            let postfix = 1;
            let finalSheetName = sheetName;
            while (wb.SheetNames.includes(finalSheetName)) {
                // leave room for `_N`
                const baseName = sheetName.substring(0, 28);
                finalSheetName = `${baseName}_${postfix}`;
                postfix++;
            }

            try {
                let stringData = '';
                // Check if buffer starts with UTF-16LE BOM (FF FE)
                if (file.buffer.length >= 2 && file.buffer[0] === 0xFF && file.buffer[1] === 0xFE) {
                    stringData = file.buffer.toString('utf16le');
                } else {
                    stringData = file.buffer.toString('utf8');
                }

                // Strip UTF-8 or UTF-16 Byte Order Mark (BOM)
                stringData = stringData.replace(/^\uFEFF/, '');

                let parsedJson;

                try {
                    // Try parsing normally first
                    parsedJson = JSON.parse(stringData);
                } catch (err) {
                    // If failed, try autofix
                    parsedJson = autofixJsonString(stringData);
                }

                // Process parsedJson into vertical [ ["Key", "Value"] ] format
                const rows = flattenObjectToVertialRows(parsedJson);

                // Add header
                rows.unshift(['Atribut', 'Nilai']);

                const ws = XLSX.utils.aoa_to_sheet(rows);

                // Give some column widths
                ws['!cols'] = [
                    { wch: 40 }, // Atribut
                    { wch: 60 }  // Nilai
                ];

                XLSX.utils.book_append_sheet(wb, ws, finalSheetName);
                successCount++;

            } catch (err: any) {
                console.error(`Failed to parse file ${file.originalname}:`, err.message);
                failCount++;
                failedFiles.push(file.originalname);
            }
        }

        if (successCount === 0) {
            return res.status(400).json({
                message: 'Semua file gagal diproses. Pastikan file JSON valid.',
                failedCount: failCount,
                failedFiles
            });
        }

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Tools_Export_${Date.now()}.xlsx`);
        res.setHeader('X-Success-Count', successCount.toString());
        res.setHeader('X-Fail-Count', failCount.toString());

        return res.send(buffer);

    } catch (error) {
        console.error('convertJsonToExcel processing error:', error);
        next(error);
    }
};
