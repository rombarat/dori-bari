import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/social-icons";
import { summarizeHours } from "@/lib/pickup";
import { telHref } from "@/lib/format";
import type { BusinessSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  const hours = summarizeHours(settings.weekly_hours);
  return (
    <footer className="mt-24 bg-ganache text-[#efe3dc]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Image
            src="/brand/logo.png"
            alt="Dor.Bari Bakery"
            width={404}
            height={132}
            className="h-14 w-auto brightness-0 invert opacity-90"
          />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-[#cdbab0]">
            קונדיטוריה בעבודת יד. עוגות, טארטים, עוגיות ומאפים מחומרי גלם משובחים.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[22px] text-white">הזמנות</h2>
          <ul className="mt-3 space-y-2 text-[15px]">
            {settings.phone && (
              <li>
                <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 hover:text-white">
                  <Phone className="size-4" aria-hidden="true" />
                  <span dir="ltr">{settings.phone}</span>
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 break-all hover:text-white">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[22px] text-white">שעות פעילות</h2>
          <ul className="mt-3 space-y-1 text-[15px]">
            {hours.map((h) => (
              <li key={h.days}>
                {h.days} <span className="tabular" dir="ltr">{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[22px] text-white">עקבו אחרינו</h2>
          <ul className="mt-3 flex gap-2">
            {settings.instagram_url && (
              <li>
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="size-5" />
                </a>
              </li>
            )}
            {settings.facebook_url && (
              <li>
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="size-5" />
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 text-[13px] text-[#a8948a] md:px-8">
          <span>© {new Date().getFullYear()} Dor.Bari</span>
          <Link href="/admin" className="hover:text-white">
            כניסת מנהלת
          </Link>
        </div>
      </div>
    </footer>
  );
}
