import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Divider } from '../../components'
import { JobCard } from '../components/JobCard/JobCard'
import { ReviewCard } from '../components/ReviewCard/ReviewCard'
import type { CompanyReview } from '../types'
import {
  StarIcon,
  StarOutlineIcon,
  VerifiedShieldIcon,
  LocationIcon,
  UsersIcon,
  CalendarIcon,
  CheckIcon,
} from '../icons'
// TODO: replace with real Supabase query by company id
import { companies, jobs, companyDetails, companyReviews } from '../data/mock'

export const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const company = companies.find((c) => c.id === id) ?? companies[0]
  const detail = companyDetails.find((d) => d.companyId === company.id) ?? companyDetails[0]
  const companyJobs = jobs.filter((j) => j.companyId === company.id)
  const [reviews, setReviews] = useState<CompanyReview[]>(
    companyReviews.filter((r) => r.companyId === company.id)
  )
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'jobs'>('about')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    body: '',
    pros: '',
    cons: '',
    recommend: true,
  })
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : detail.avgRating

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }))

  const handleSubmitReview = () => {
    if (!reviewForm.title || !reviewForm.body) return
    const newReview: CompanyReview = {
      id: `cr-new-${Date.now()}`,
      workerId: 'w1',
      workerName: 'Marcus T.',
      workerInitials: 'MT',
      companyId: company.id,
      rating: reviewForm.rating,
      title: reviewForm.title,
      body: reviewForm.body,
      pros: reviewForm.pros,
      cons: reviewForm.cons,
      recommend: reviewForm.recommend,
      datedMonthsAgo: 0,
      isVerified: true,
    }
    setReviews((prev) => [newReview, ...prev])
    setReviewSubmitted(true)
    setShowReviewForm(false)
    setActiveTab('reviews')
  }

  const tabStyle = (tab: string) =>
    ({
      padding: '10px 20px',
      border: 'none',
      borderBottom: `2px solid ${activeTab === tab ? 'var(--kt-primary)' : 'transparent'}`,
      background: 'transparent',
      color: activeTab === tab ? 'var(--kt-text)' : 'var(--kt-text-muted)',
      fontWeight: activeTab === tab ? 'var(--kt-weight-semibold)' : 'var(--kt-weight-normal)',
      fontSize: 'var(--kt-text-sm)',
      cursor: 'pointer',
      fontFamily: 'var(--kt-font-sans)',
      transition: 'color 0.15s',
    }) as React.CSSProperties

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Hero Banner */}
      <div style={{ background: 'var(--kt-surface)', borderBottom: '1px solid var(--kt-border)' }}>
        <div
          style={{
            height: 140,
            background: 'var(--kt-grey-100)',
          }}
        />
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            paddingBottom: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'flex-end',
              marginTop: -40,
              flexWrap: 'wrap',
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--kt-radius-lg)',
                background: 'var(--kt-grey-100)',
                color: 'var(--kt-navy-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-2xl)',
                border: '4px solid var(--kt-white)',
                flexShrink: 0,
                boxShadow: 'var(--kt-shadow-sm)',
              }}
            >
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <h1
                  style={{
                    fontSize: 'var(--kt-text-2xl)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    margin: 0,
                  }}
                >
                  {company.name}
                </h1>
                {company.isVerified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <VerifiedShieldIcon size={16} color="var(--kt-olive-600)" />
                    <span
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-accent)',
                        fontWeight: 'var(--kt-weight-medium)',
                      }}
                    >
                      Verified
                    </span>
                  </div>
                )}
              </div>
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                {detail.tagline}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  <LocationIcon size={14} /> {detail.headquarters}
                </span>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  <UsersIcon size={14} /> {detail.teamSize} employees
                </span>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  <CalendarIcon size={14} /> Founded {detail.founded}
                </span>
              </div>
            </div>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'var(--kt-text-lg)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  {avgRating.toFixed(1)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginBottom: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) =>
                    s <= Math.round(avgRating) ? (
                      <StarIcon key={s} size={16} color="var(--kt-warning)" />
                    ) : (
                      <StarOutlineIcon key={s} size={16} color="var(--kt-warning)" />
                    )
                  )}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--kt-text-muted)' }}>
                  {reviews.length} reviews
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'var(--kt-text-lg)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  {companyJobs.length}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--kt-text-muted)' }}>Open Jobs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
          position: 'sticky',
          top: 64,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            display: 'flex',
          }}
        >
          {(['about', 'reviews', 'jobs'] as const).map((tab) => (
            <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
              {tab === 'about'
                ? 'About'
                : tab === 'reviews'
                  ? `Reviews (${reviews.length})`
                  : `Jobs (${companyJobs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '28px var(--kt-space-6)',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Culture */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 12,
                  }}
                >
                  Culture
                </h2>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    lineHeight: 1.7,
                  }}
                >
                  {detail.culture}
                </p>
              </div>

              {/* Mission */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 12,
                  }}
                >
                  Mission
                </h2>
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                  }}
                >
                  {detail.mission}
                </p>
              </div>

              {/* Benefits */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 16,
                  }}
                >
                  Benefits
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 12,
                  }}
                >
                  {detail.benefits.map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 'var(--kt-radius-md)',
                        border: '1px solid var(--kt-border)',
                        background: 'var(--kt-bg)',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{b.icon}</span>
                      <span
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-medium)',
                          color: 'var(--kt-text)',
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 16,
                  }}
                >
                  Photos
                </h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  {detail.photoEmojis.map((emoji, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        aspectRatio: '1',
                        borderRadius: 'var(--kt-radius-md)',
                        background: 'var(--kt-bg)',
                        border: '1px solid var(--kt-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                      }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              {/* Perks */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 12,
                  }}
                >
                  Perks
                </h2>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {detail.perks.map((perk) => (
                    <li
                      key={perk}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                      }}
                    >
                      <CheckIcon size={14} color="var(--kt-olive-600)" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Rating breakdown */}
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 'var(--kt-weight-bold)',
                        color: 'var(--kt-text)',
                        lineHeight: 1,
                      }}
                    >
                      {avgRating.toFixed(1)}
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '6px 0' }}
                    >
                      {[1, 2, 3, 4, 5].map((s) =>
                        s <= Math.round(avgRating) ? (
                          <StarIcon key={s} size={16} color="var(--kt-warning)" />
                        ) : (
                          <StarOutlineIcon key={s} size={16} color="var(--kt-warning)" />
                        )
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      {reviews.length} reviews
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {ratingDist.map(({ star, count, pct }) => (
                      <div
                        key={star}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            width: 30,
                          }}
                        >
                          {star} <StarIcon size={12} color="var(--kt-warning)" />
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: 'var(--kt-border)',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'var(--kt-warning)',
                              borderRadius: 4,
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            width: 20,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {!reviewSubmitted && (
                  <div style={{ marginTop: 20 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      {showReviewForm ? 'Cancel' : '+ Write a Review'}
                    </Button>
                  </div>
                )}
                {reviewSubmitted && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '10px 14px',
                      background: 'color-mix(in srgb, var(--kt-success) 10%, transparent)',
                      borderRadius: 'var(--kt-radius-md)',
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-success)',
                    }}
                  >
                    <CheckIcon size={14} /> Your review has been submitted!
                  </div>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div
                  style={{
                    background: 'var(--kt-surface)',
                    border: '1px solid var(--kt-border)',
                    borderRadius: 'var(--kt-radius-lg)',
                    padding: 24,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 'var(--kt-text-md)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      marginBottom: 16,
                    }}
                  >
                    Write a Review
                  </h3>
                  {/* Star picker */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 8,
                      }}
                    >
                      Rating
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                          }}
                        >
                          {s <= reviewForm.rating ? (
                            <StarIcon size={16} color="var(--kt-warning)" />
                          ) : (
                            <StarOutlineIcon size={16} color="var(--kt-warning)" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {[
                    { key: 'title', label: 'Title', placeholder: 'e.g., Great crew, solid pay' },
                    { key: 'body', label: 'Your Review', placeholder: 'Share your experience...' },
                    { key: 'pros', label: 'Pros', placeholder: 'What did you like?' },
                    { key: 'cons', label: 'Cons', placeholder: 'What could be better?' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </label>
                      {key === 'body' ? (
                        <textarea
                          value={(reviewForm as unknown as Record<string, string>)[key]}
                          onChange={(e) => setReviewForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          rows={3}
                          style={{
                            width: '100%',
                            resize: 'vertical',
                            padding: '8px 12px',
                            border: '1px solid var(--kt-border)',
                            borderRadius: 'var(--kt-radius-md)',
                            background: 'var(--kt-bg)',
                            color: 'var(--kt-text)',
                            fontFamily: 'var(--kt-font-sans)',
                            fontSize: 'var(--kt-text-sm)',
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={(reviewForm as unknown as Record<string, string>)[key]}
                          onChange={(e) => setReviewForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--kt-border)',
                            borderRadius: 'var(--kt-radius-md)',
                            background: 'var(--kt-bg)',
                            color: 'var(--kt-text)',
                            fontFamily: 'var(--kt-font-sans)',
                            fontSize: 'var(--kt-text-sm)',
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      id="recommend"
                      checked={reviewForm.recommend}
                      onChange={(e) =>
                        setReviewForm((f) => ({ ...f, recommend: e.target.checked }))
                      }
                    />
                    <label
                      htmlFor="recommend"
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                        cursor: 'pointer',
                      }}
                    >
                      I recommend this employer
                    </label>
                  </div>
                  <Button variant="primary" size="md" onClick={handleSubmitReview}>
                    Submit Review
                  </Button>
                </div>
              )}

              {/* Review list */}
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
              {reviews.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--kt-text-muted)',
                    fontSize: 'var(--kt-text-sm)',
                  }}
                >
                  No reviews yet. Be the first to write one!
                </div>
              )}
            </div>
          )}

          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {companyJobs.map((job) => (
                <JobCard key={job.id} job={job} compact={false} />
              ))}
              {companyJobs.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--kt-text-muted)',
                    fontSize: 'var(--kt-text-sm)',
                  }}
                >
                  No open positions at this time.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 120,
          }}
        >
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 18,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 14,
              }}
            >
              Company Info
            </h3>
            {[
              { label: 'Location', value: detail.headquarters },
              { label: 'Team Size', value: `${detail.teamSize} employees` },
              { label: 'Founded', value: String(detail.founded) },
              { label: 'Industry', value: company.industry },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    fontWeight: 'var(--kt-weight-medium)',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <Divider />
          <Link to="/site/jobs" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm" style={{ width: '100%' }}>
              ← Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
