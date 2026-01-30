
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-500">
                            error
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Oops! Something went wrong
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {isRouteErrorResponse(error)
                            ? `${error.status} ${error.statusText}`
                            : (error as any)?.message || "An unexpected error occurred."}
                    </p>

                    <div className="space-y-3">
                        <Link
                            to="/"
                            className="block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="block w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="text-left bg-slate-100 dark:bg-slate-950 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {String(error)}
                    </div>
                )}
            </div>
        </div>
    );
}
