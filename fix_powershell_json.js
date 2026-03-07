#!/usr/bin/env node

/**
 * PowerShell JSON Autofix Tool
 * 
 * Script ini berfungsi untuk memperbaiki output file JSON yang corrupted atau tidak valid
 * hasil export dari PowerShell. Masalah yang sering terjadi di PowerShell meliputi:
 *  - Kurung kurawal tambahan `{"`
 *  - Koma ekstra di awal baris `,"`
 *  - Format aneh pada key/value seperti `:"` atau `: :"`
 *  - Kurung siku ganda pada array `[[` atau `[{`
 */

const fs = require('fs');
const path = require('path');

function autofixJson(inputPath, outputPath) {
    try {
        let rawBuffer = fs.readFileSync(inputPath);
        let data = '';
        console.log(`[1/3] Membaca file: ${inputPath}`);

        if (rawBuffer.length >= 2 && rawBuffer[0] === 0xFF && rawBuffer[1] === 0xFE) {
            data = rawBuffer.toString('utf16le');
        } else {
            data = rawBuffer.toString('utf8');
        }
        data = data.replace(/^\uFEFF/, '');

        // 1. Memperbaiki wrapper object keys `{"...` menjadi `"...`
        data = data.replace(/\{"/g, '"');
        data = data.replace(/,"/g, '"');

        // 2. Memperbaiki spasi ganda dan colon pada boolean, null, angka
        // Contoh: `"Shared": :false` menjadi `"Shared": false`
        data = data.replace(/"\s*:\s*:\s*null/gi, '": null');
        data = data.replace(/"\s*:\s*:\s*true/gi, '": true');
        data = data.replace(/"\s*:\s*:\s*false/gi, '": false');
        // Fix Catastrophic Backtracking
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

        console.log(`[2/3] Menerapkan regex autofix pada teks mentah...`);

        // 7. Parse text yang sudah bersih untuk validasi format akhir
        const parsed = JSON.parse(data);

        // 8. Tulis kembali (convert) dengan format rapi / beautified JSON
        fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`[3/3] ✅ Berhasil! JSON versi bersih disimpan di: ${outputPath}`);

        return true;

    } catch (e) {
        console.error(`\n❌ Gagal Parsing JSON: ${e.message}`);

        // Tampilkan log lokasi kegagalan untuk memudahkan custom debugging
        const posMatch = e.message.match(/position (\d+)/);
        if (posMatch) {
            let pos = parseInt(posMatch[1], 10);
            data = data || '';
            console.error("\nCuplikan teks di sekitar error syntax:");
            console.error("--------------------------------------------------");
            console.error(data.substring(Math.max(0, pos - 40), pos + 40));
            console.error(" ".repeat(40) + "^");
            console.error("--------------------------------------------------");
        }

        // Simpan hasil teks yang gagal agar bisa diinspeksi manual
        const errPath = outputPath + '.error.txt';
        fs.writeFileSync(errPath, data || '', 'utf8');
        console.log(`⚠️  Teks hasil sementara (yang gagal di-parse) disimpan ke: ${errPath}`);
        return false;
    }
}

// CLI Executor
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("🛠️  Windows/PowerShell JSON Autofix Tool");
    console.log("Cara penggunaan:");
    console.log("  node fix_powershell_json.js <file_input.json> [file_output.json]");
    process.exit(1);
}

const inputFile = path.resolve(args[0]);
const outputFile = args[1] ? path.resolve(args[1]) : inputFile.replace(/\.json$/, '_fixed.json');

if (!fs.existsSync(inputFile)) {
    console.error(`❌ File tidak ditemukan: ${inputFile}`);
    process.exit(1);
}

autofixJson(inputFile, outputFile);
