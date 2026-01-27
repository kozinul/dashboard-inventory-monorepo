export function Footer() {
    return (
        <footer className="w-full py-6 mt-auto border-t border-slate-200 dark:border-border-dark bg-white/50 dark:bg-card-dark/50 backdrop-blur-sm">
            <div className="container px-6 mx-auto">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} Dashboard Inventory. All rights reserved.</p>

                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Support</a>
                    </div>

                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <span>v1.0.0</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>Built with React & Vite</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
