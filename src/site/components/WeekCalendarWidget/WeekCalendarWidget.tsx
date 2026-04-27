import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon } from '../../icons'
import { getWeekInterviews, type InterviewEvent } from '../../services/interviewService'
import styles from './WeekCalendarWidget.module.css'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMondayOfWeek(ref = new Date()): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { companyId: string }

export const WeekCalendarWidget: React.FC<Props> = ({ companyId }) => {
  const [events, setEvents] = useState<InterviewEvent[]>([])
  const today = new Date()
  const monday = getMondayOfWeek(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  useEffect(() => {
    let cancelled = false
    getWeekInterviews(companyId).then(({ data }) => {
      if (!cancelled) setEvents(data)
    })
    return () => {
      cancelled = true
    }
  }, [companyId])

  const eventsForDay = (day: Date) => events.filter((e) => isSameDay(new Date(e.scheduled_at), day))

  const isEmpty = events.length === 0

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <CalendarIcon size={16} color="var(--kt-olive-700)" />
          This week
        </h2>
        <Link to="/site/dashboard/interviews" className={styles.viewAll}>
          View full calendar →
        </Link>
      </div>

      <div className={styles.grid}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const dayEvents = eventsForDay(day)

          return (
            <div key={i} className={styles.dayCol}>
              <div className={styles.dayHeader}>
                <span className={styles.weekday}>{WEEKDAYS[i]}</span>
                <span className={isToday ? styles.dateToday : styles.date}>{day.getDate()}</span>
              </div>
              <div className={styles.eventList}>
                {dayEvents.map((e) => {
                  const confirmed = e.status === 'scheduled'
                  return (
                    <div
                      key={e.interview_id}
                      className={confirmed ? styles.eventConfirmed : styles.eventPending}
                      title={`${e.applicant_name} · ${e.job_title}`}
                    >
                      <span className={styles.eventName}>{e.applicant_name}</span>
                      <span className={styles.eventTime}>{formatTime(e.scheduled_at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {isEmpty && (
          <div className={styles.emptyOverlay}>
            <div className={styles.emptyContent}>
              <p className={styles.emptyTitle}>No interviews scheduled this week</p>
              <p className={styles.emptySubtitle}>
                When you schedule an interview it will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
