import { Button } from '@/components/ui/Button'

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-8">
            <div className="flex items-center gap-4">
                {/* Breadcrumb or Title placeholder */}
                <h2 className="text-lg font-medium text-foreground">User Management</h2>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <span className="material-symbols-outlined">search</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <span className="material-symbols-outlined">notifications</span>
                </Button>
                <div className="ml-2 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="text-xs font-bold text-primary">JD</span>
                </div>
            </div>
        </header>
    )
}
