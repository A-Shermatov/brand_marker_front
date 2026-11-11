"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { CalendarDotsIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr"
import { ru } from "react-day-picker/locale"
import { cn } from "@/lib/utils"
import {
  RU_TIME_PLACEHOLDER,
  deadlineMoment,
  isValidIsoDate,
  isValidTime,
  joinDateTime,
  maskTimeInput,
  splitDateTime,
  toIsoDay,
} from "@/lib/iso-date"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DateInputRu } from "@/components/ui/date-input-ru"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DateTimeInputProps = {
  id?: string
  /** "" | `yyyy-mm-dd` | `yyyy-mm-ddThh:mm`. */
  value: string
  onChange: (value: string) => void
  /** ISO days that bound what can be typed (the year range). */
  min?: string
  max?: string
  /** The calendar does not offer days before this ISO day (today, for a deadline). */
  notBefore?: string
  invalid?: boolean
  /** Size and corners of the field, to match the inputs around it. */
  className?: string
  /** What the date is, for the calendar button: «Дедлайн заявки». */
  label?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
const QUICK_TIMES = ["09:00", "12:00", "15:00", "18:00"]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2 text-[14px] tnum outline-none focus:border-primary"

/**
 * A date with a time of day. The day and the time can be typed, or picked with
 * the calendar button: a month grid plus hours and minutes. The time is
 * optional — a day alone means "through the end of that day".
 */
export const DateTimeInput = ({
  id,
  value,
  onChange,
  min,
  max,
  notBefore,
  invalid,
  className,
  label = "дату",
}: DateTimeInputProps) => {
  const { date, time } = splitDateTime(value)
  const [open, setOpen] = useState(false)
  // What is in the time box. It can run ahead of `value`: a time typed before the day is kept here.
  const [timeText, setTimeText] = useState(time)

  useEffect(() => {
    if (date) setTimeText(time)
  }, [date, time])

  const validTime = isValidTime(timeText) ? timeText : ""
  const [hours, minutes] = validTime ? validTime.split(":") : ["", ""]

  const applyDate = (nextDate: string) => {
    onChange(joinDateTime(nextDate, nextDate ? validTime : ""))
  }

  const applyTime = (nextTime: string) => {
    setTimeText(nextTime)
    if (date) onChange(joinDateTime(date, nextTime))
  }

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const masked = maskTimeInput(event.target.value)
    setTimeText(masked)
    if (masked === "") {
      if (date && time) onChange(date)
      return
    }
    if (isValidTime(masked) && date && masked !== time) onChange(joinDateTime(date, masked))
  }

  const handleTimeBlur = () => {
    if (timeText === "" || isValidTime(timeText)) return
    // "7" or "7:3": finish it when it reads as a time, otherwise put the old one back.
    const [h = "", m = ""] = timeText.split(":")
    const guess = `${h.padStart(2, "0")}:${m.padEnd(2, "0")}`
    applyTime(isValidTime(guess) ? guess : time)
  }

  const selected = date && isValidIsoDate(date) ? deadlineMoment(date) : null
  const firstDay = notBefore && isValidIsoDate(notBefore) ? deadlineMoment(notBefore) : null

  return (
    <div
      className={cn(
        "flex w-full items-center border bg-card transition-colors focus-within:border-primary",
        invalid ? "border-destructive" : "border-border",
        className,
      )}
    >
      <DateInputRu
        id={id}
        min={min}
        max={max}
        value={date}
        onChange={applyDate}
        aria-invalid={invalid}
        className="h-full min-w-0 flex-1 bg-transparent pl-3.5 pr-1 tnum outline-none"
      />
      <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
      <input
        id={id ? `${id}-time` : undefined}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder={RU_TIME_PLACEHOLDER}
        value={timeText}
        onChange={handleTimeChange}
        onBlur={handleTimeBlur}
        aria-label="Время: часы и минуты"
        className="h-full w-[68px] shrink-0 bg-transparent px-2 text-center tnum outline-none"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Выбрать ${label} и время в календаре`}
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:bg-secondary focus-visible:text-primary focus-visible:outline-none"
          >
            <CalendarDotsIcon weight="duotone" className="size-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={ru}
            selected={selected ?? undefined}
            defaultMonth={selected ?? firstDay ?? undefined}
            onSelect={(day) => {
              if (day) applyDate(toIsoDay(day))
            }}
            disabled={firstDay ? { before: firstDay } : undefined}
          />
          <div className="grid gap-2.5 border-t border-border px-3 py-3">
            <div className="flex items-center gap-2">
              <ClockIcon weight="duotone" className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-[13.5px] font-medium text-foreground">Время</span>
              <span className="flex-1" />
              <select
                aria-label="Часы"
                value={hours}
                onChange={(e) => applyTime(`${e.target.value}:${minutes || "00"}`)}
                className={selectClass}
              >
                <option value="" disabled>
                  чч
                </option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground" aria-hidden>
                :
              </span>
              <select
                aria-label="Минуты"
                value={minutes}
                onChange={(e) => applyTime(`${hours || "00"}:${e.target.value}`)}
                className={selectClass}
              >
                <option value="" disabled>
                  мм
                </option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_TIMES.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => applyTime(quick)}
                  aria-pressed={validTime === quick}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-[12.5px] font-medium tnum transition-colors",
                    validTime === quick
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/50",
                  )}
                >
                  {quick}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyTime("")}
                aria-pressed={validTime === ""}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors",
                  validTime === ""
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary/50",
                )}
              >
                До конца дня
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="max-w-[190px] text-[12px] leading-snug text-muted-foreground">
                {date
                  ? validTime
                    ? "Срок закончится в указанную минуту."
                    : "Без времени срок действует до конца дня."
                  : "Сначала выберите день в календаре."}
              </p>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Готово
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
