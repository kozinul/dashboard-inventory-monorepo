import { PhotoIcon, PlusIcon } from "@heroicons/react/24/outline";

export function AssetGallery() {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold dark:text-white">Visual Documentation</h3>
                </div>
                <p className="text-xs text-slate-500">4 total images found</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Thumbnails */}
                {[
                    { title: "Front View", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7Q_ty-9ctZRoc_xIolPTdKNChIMBZ0pts-qx72C0T8-MeB0kHFttTHK4MSh65K-C2UrH9C4TxqiE2uSI-xz3zrnnl8eenHrLAmEsQKpBUCKPbW5WR1P5tDduDdItVq4wJi5YCrdM5HUxge-iU6VXInDJb5BAjBjsrawXOPX2BgeXMNlnX2TIC_V2tgyT7cC_MOBgDXK5sbfaWSBfUtL77_4frpaBEdik_Ifv4gh2W1BHy5sz6vthviH0_wlWHh12syECueCqY2lo" },
                    { title: "Back View", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBddBks1SmJ9pTBdZJGG-cpOHVCtesGpnA3oEALdoXB65TVeMyZRjORrxdjlqO8u3UlTvuAVc7EDxuxb87w2avn_JEy8HntZn20Xs1ECMEyXZLVTqH71NrF6gFQRTzqgK4qcsjWlramYmfMCOPf65w_2aUrvJYk6GUfnOPSPlQCwnbJWryRbWGLPtzext9FMHcRkG6L5Fitkcm3_4vHeHOfVgGrER4HomimXfOa4WZyYBDzHr7-k0J9ZzWwLcC4_-GhqbfZfFLAf1M" },
                    { title: "Connection Ports", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4aMjr6WMhzVYQ1qZhTJ3yiOMOymBhGYdiwLBTgkRUXjendvWFbr02AYJOidH4Rxp8UsIMdMPOz2WnYZs-otopfUCTYcKhk6TgKWmxYhtzi6f9nduAOQCOkchupaLezbe0_Q_JMTsgK3iOnVEDrLeSnq70iyuFf8vsPB6q--MOjixb-q4OKYS9koF1DfrG6jTzDB1LlZDu1ntwxAUbcC0NL8ONtGs7vR2A0PZ6BaWZQQzJBspZ64s4qfIF997Do9Umpl2ltvydLLI" },
                    { title: "Serial Sticker", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFNkiVo3Ti11ii1f_lL1eunAXtd9UKpMDha6Fuie82bOrt5y6pqN3SE4sQZuju8-e6bfMfvTzV50O6tmD5KsJrIr43b2eJgrlhxO-jYO353DNP3XKJc3t3otXKwmS5F-0sVxU1UvOGFBYIt9AFeWRmF9x_pArE0BweWrsZnjMlfWPiBCWqOJTWPFuYt6y3HDBEIAR-YmL-VVTJoAn8Oh_TfSd64USl6KiMT4o2oxe6xGbjCPieQYLPn9W7KTLhiEgd0Gr9mfqhzh8" },
                ].map((item, idx) => (
                    <div key={idx} className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <img
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            alt={item.title}
                            src={item.src}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[10px] text-white font-medium truncate">{item.title}</p>
                        </div>
                    </div>
                ))}

                {/* Upload Button */}
                <button className="aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/5 hover:border-primary transition-all text-slate-500 hover:text-primary">
                    <PlusIcon className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Upload Photo</span>
                </button>
            </div>
        </section>
    );
}
