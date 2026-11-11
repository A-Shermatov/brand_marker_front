import Link from "next/link"
import { DeviceMobileIcon as Smartphone } from "@phosphor-icons/react/dist/ssr"
import { BrandLogo } from "@/components/bm"
import {
  forSuppliersUrl,
  guaranteeUrl,
  helpUrl,
  newRfqRedirect,
  performersUrl,
  registerUrl,
  tariffsUrl,
} from "@/lib/marketplace-routes"

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="grid content-start gap-4">
          <BrandLogo />
          <p className="max-w-xs text-[14.5px] text-mute">
            B2B‑площадка для закупок компаний Таджикистана. Платежи проводит банк‑партнёр,
            площадка не хранит данные карт.
          </p>
          <span className="inline-flex items-center gap-2 text-[13px] text-mute">
            <Smartphone className="size-4" aria-hidden />
            Мобильное приложение готовим
          </span>
        </div>

        <div className="grid content-start gap-3">
          <b className="text-[13.5px] font-semibold text-ink">Покупателям</b>
          <ul className="grid gap-2.5 text-[14.5px] text-mute">
            <li>
              <Link href="/services" className="hover:text-ink">
                Каталог
              </Link>
            </li>
            <li>
              <Link href={newRfqRedirect()} className="hover:text-ink">
                Разместить заявку
              </Link>
            </li>
            <li>
              <Link href={guaranteeUrl()} className="hover:text-ink">
                Как работает гарантия
              </Link>
            </li>
          </ul>
        </div>

        <div className="grid content-start gap-3">
          <b className="text-[13.5px] font-semibold text-ink">Поставщикам</b>
          <ul className="grid gap-2.5 text-[14.5px] text-mute">
            <li>
              <Link href={forSuppliersUrl()} className="hover:text-ink">
                Начать продавать
              </Link>
            </li>
            <li>
              <Link href={tariffsUrl()} className="hover:text-ink">
                Тарифы для продавцов
              </Link>
            </li>
            <li>
              <Link href={registerUrl()} className="hover:text-ink">
                Кабинет продавца
              </Link>
            </li>
          </ul>
        </div>

        <div className="grid content-start gap-3">
          <b className="text-[13.5px] font-semibold text-ink">Помощь</b>
          <ul className="grid gap-2.5 text-[14.5px] text-mute">
            <li>
              <Link href={guaranteeUrl()} className="hover:text-ink">
                Частые вопросы
              </Link>
            </li>
            <li>
              <a href="tel:+992446000000" className="hover:text-ink">
                Связаться с поддержкой
              </a>
            </li>
            <li>
              <Link href={helpUrl()} className="hover:text-ink">
                Правила площадки
              </Link>
            </li>
            <li>
              <Link href={performersUrl({ verified: true })} className="hover:text-ink">
                Проверенные поставщики
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-x-6 gap-y-1 px-4 py-5 text-[13px] text-mute lg:px-8">
          <span>© 2026 Brand Market</span>
          <Link href={helpUrl()} className="hover:text-ink">
            Конфиденциальность
          </Link>
          <Link href={helpUrl()} className="hover:text-ink">
            Условия использования
          </Link>
        </div>
      </div>
    </footer>
  )
}
