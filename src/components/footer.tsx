"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocaleContext } from "@/context/LocaleContext";
import { t } from "@/lib/i18n";
import { Mail, ExternalLink } from "lucide-react";

export function Footer() {
  const { locale } = useLocaleContext();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 text-slate-400 mt-auto">
      <div className="container mx-auto px-6 py-10 lg:py-14">
        {/* Main Content */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
          
          {/* Brand Identity */}
          <div className="flex flex-col gap-5 max-w-xl">
            <Link href="https://cristianb.dev" target="_blank" className="block w-fit group">
              <Image
                src="/cristianbdev-logo.webp"
                alt="CristianBDev"
                width={120}
                height={40}
                className="w-auto h-10 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                priority
              />
            </Link>
            <div className="space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed">
                {t(locale, "footer.developed")}{" "}
                <span className="font-semibold text-slate-100">CristianBDev</span>.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                {t(locale, "footer.usage")}
              </p>
            </div>
          </div>

          {/* Direct Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              {t(locale, "footer.inquiries")}
            </h4>
            <div className="flex flex-col gap-3">
              <Link 
                href="mailto:hi@cristianb.dev" 
                className="group flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                hi@cristianb.dev
              </Link>
              <Link 
                href="https://cristianb.dev" 
                target="_blank"
                className="group flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                Portfolio
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
          <p>© {currentYear} CristianBDev • {t(locale, "footer.copyright")}</p>
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-slate-800"></span>
            <span className="font-mono lowercase opacity-60">v1.2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
