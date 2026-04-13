import React, { useState, useEffect, useRef } from 'react';
import { uploadResume, getResume, deleteResume } from '../services/resumeService';
import { downloadResumePDF, triggerDownload } from '../services/pdfService';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ResumeUploadPage() {
  const [resume, setResume]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [jd, setJd]                 = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    getResume()
      .then(({ data }) => setResume(data.resume))
      .catch((err) => {
        // 404 = no resume yet — that's fine, show upload UI
        if (err.response?.status !== 404) {
          toast.error('Failed to load resume');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('resume', file);
    if (jd) fd.append('jobDescription', jd);
    setUploading(true);
    try {
      const { data } = await uploadResume(fd);
      setResume(data.resume);
      toast.success('Resume parsed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your resume?')) return;
    try { await deleteResume(); setResume(null); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await downloadResumePDF();
      triggerDownload(data, 'resume.pdf');
    } catch { toast.error('Failed to generate PDF'); }
    finally { setDownloading(false); }
  };

  if (loading) return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1,2].map((i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }} className="anim-fade-up">

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Resume</h1>
        <p style={{ fontSize: '0.857rem', margin: 0 }}>
          Upload your PDF — AI parses it and scores ATS compatibility.
        </p>
      </div>

      {!resume ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* JD input — optional, shown before upload */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                Job description
              </label>
              <span style={{ fontSize: '0.714rem', color: 'var(--text-muted)' }}>optional — improves ATS scoring</span>
            </div>
            <textarea
              className="input"
              style={{ minHeight: 80, resize: 'vertical', fontSize: '0.829rem' }}
              placeholder="Paste the JD to get a targeted ATS score…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '1px dashed var(--border-mid)',
              borderRadius: 'var(--r-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color var(--t-base), background var(--t-base)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {uploading ? (
              <LoadingSpinner text="Parsing with AI…" />
            ) : (
              <>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--r-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, margin: '0 auto 12px',
                  transform: 'rotate(-1deg)',
                }}>◫</div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Drop your PDF here
                </div>
                <div style={{ fontSize: '0.786rem', color: 'var(--text-muted)' }}>
                  or click to browse · PDF only · max 10MB
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ATS score — the headline number */}
          <div className="card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>ATS compatibility</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{
                    fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1,
                    color: resume.atsScore >= 70 ? 'var(--green)' : resume.atsScore >= 40 ? 'var(--yellow)' : 'var(--red)',
                  }}>
                    {resume.atsScore ?? '—'}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                </div>
                {resume.atsFeedback && (
                  <p style={{ fontSize: '0.829rem', margin: '8px 0 0', maxWidth: 420, lineHeight: 1.55 }}>
                    {resume.atsFeedback}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? '…' : '↓ PDF'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  Re-upload
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />
          </div>

          {/* Skills — full width, prominent */}
          {resume.skillTags?.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>
                Skills · {resume.skillTags.length} detected
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {resume.skillTags.map((s) => <Badge key={s} variant="blue">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Info grid — asymmetric: personal info narrower */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 12 }}>
            {/* Personal */}
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12 }}>
                Contact
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Name', resume.parsed?.name],
                  ['Email', resume.parsed?.email],
                  ['Phone', resume.parsed?.phone],
                  ['Location', resume.parsed?.location],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: '0.786rem', color: 'var(--text-secondary)' }} className="truncate">{v}</span>
                  </div>
                ))}
              </div>
              {resume.parsed?.summary && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', marginBottom: 5 }}>Summary</div>
                  <p style={{ fontSize: '0.786rem', margin: 0, lineHeight: 1.55 }}>{resume.parsed.summary}</p>
                </div>
              )}
            </div>

            {/* Experience */}
            {resume.parsed?.experience?.length > 0 && (
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Experience
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {resume.parsed.experience.map((e, i) => (
                    <div key={i} style={{
                      paddingLeft: 10,
                      borderLeft: '2px solid var(--border-strong)',
                      paddingBottom: i < resume.parsed.experience.length - 1 ? 12 : 0,
                      borderBottom: i < resume.parsed.experience.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)' }}>{e.role}</div>
                      <div style={{ fontSize: '0.786rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                        {e.company}
                        {e.duration && <span style={{ color: 'var(--text-muted)' }}> · {e.duration}</span>}
                      </div>
                      {e.description && (
                        <p style={{ fontSize: '0.786rem', margin: '4px 0 0', lineHeight: 1.5 }}>{e.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Projects — full width, only when present */}
          {resume.parsed?.projects?.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12 }}>
                Projects
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {resume.parsed.projects.map((p, i) => (
                  <div key={i} style={{
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                  }}>
                    <div style={{ fontSize: '0.857rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {p.name}
                    </div>
                    {p.description && (
                      <p style={{ fontSize: '0.786rem', margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {p.technologies?.map((t) => <Badge key={t} variant="purple">{t}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
