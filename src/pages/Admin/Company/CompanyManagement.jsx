import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getPicklist, companyAction } from '../../../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const decodeHTML = (str) => {
  if (!str || str === '-' || str === '-1') return '';
  // Vembu stores punycode-encoded HTML — decode directly for display
  try { return str; } catch { return str; }
};

export default function CompanyManagement() {
  const user = JSON.parse(localStorage.getItem('onup_user') || '{}');
  const entityId = user.entityId;

  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: null, name: '', url: '',
    logoUrl: '', logoFile: null, logoPreview: null,
    vision: '', mission: '', values: '',
    vissionBgImag: '', missionBgImg: '', valueBgImg: '',
    vissionBodyColor: '', missionBodyColor: '', valueBodyColor: '',
    vissionHeadingColor: '', missionHeadingColor: '', valueHeadingColor: '',
    vissionOpacity: '', missionOpacity: '', valueOpacity: '',
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(companies);
    } else {
      const q = search.toLowerCase();
      setFiltered(companies.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.url || '').toLowerCase().includes(q)
      ));
    }
  }, [search, companies]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await getPicklist({ picklistType: 'COMPANY' });
      const list = res.data?.picklist || [];
      setCompanies(list);
      setFiltered(list);
    } catch (e) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({
      id: null, name: '', url: '',
      logoUrl: '', logoFile: null, logoPreview: null,
      vision: '', mission: '', values: '',
      vissionBgImag: '', missionBgImg: '', valueBgImg: '',
      vissionBodyColor: '', missionBodyColor: '', valueBodyColor: '',
      vissionHeadingColor: '', missionHeadingColor: '', valueHeadingColor: '',
      vissionOpacity: '', missionOpacity: '', valueOpacity: '',
    });
    setIsEdit(false);
    setModalOpen(true);
  };

  const openEdit = (company) => {
    setForm({
      id: company.companyId || company.id,
      name: company.name || '',
      url: company.url || '',
      logoUrl: company.logoUrl || '',
      logoFile: null,
      logoPreview: company.logoUrl || null,
      vision: decodeHTML(company.vision || ''),
      mission: decodeHTML(company.mission || ''),
      values: decodeHTML(company.values || company.companyValues || ''),
      vissionBgImag: company.vissionBgImag && company.vissionBgImag !== '-1' ? company.vissionBgImag : '',
      missionBgImg: company.missionBgImg && company.missionBgImg !== '-1' ? company.missionBgImg : '',
      valueBgImg: company.valueBgImg && company.valueBgImg !== '-1' ? company.valueBgImg : '',
      vissionBodyColor: company.vissionBodyColor || '',
      missionBodyColor: company.missionBodyColor || '',
      valueBodyColor: company.valueBodyColor || '',
      vissionHeadingColor: company.vissionHeadingColor || '',
      missionHeadingColor: company.missionHeadingColor || '',
      valueHeadingColor: company.valueHeadingColor || '',
      vissionOpacity: company.vissionOpacity && company.vissionOpacity !== '-1' ? company.vissionOpacity : '',
      missionOpacity: company.missionOpacity && company.missionOpacity !== '-1' ? company.missionOpacity : '',
      valueOpacity: company.valueOpacity && company.valueOpacity !== '-1' ? company.valueOpacity : '',
    });
    setIsEdit(true);
    setModalOpen(true);
  };

  const onLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const exts = ['jpeg', 'jpg', 'png'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!exts.includes(ext)) { toast.error('File format not supported'); return; }
    setForm(prev => ({
      ...prev,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
    e.target.value = null;
  };

  const uploadLogo = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entityId', form.name);
    const token = localStorage.getItem('onup_token');
    const res = await fetch('/api/company/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (data.Location) return data.Location;
    throw new Error('Upload failed');
  };

  const onSubmit = async () => {
    if (!form.name.trim()) { toast.warning('Enter Company Name'); return; }
    if (!form.url.trim()) { toast.warning('Enter Company URL'); return; }

    setSubmitting(true);
    try {
      let logoUrl = form.logoUrl;
      if (form.logoFile) {
        logoUrl = await uploadLogo(form.logoFile);
      }

      const payload = {
        action: isEdit ? 'UPDATE' : 'INSERT',
        id: isEdit ? form.id : undefined,
        name: form.name,
        url: form.url,
        logoUrl: logoUrl || null,
        vision: form.vision || null,
        mission: form.mission || null,
        values: form.values || null,
        vissionBgImag: form.vissionBgImag || null,
        missionBgImg: form.missionBgImg || null,
        valueBgImg: form.valueBgImg || null,
        vissionBodyColor: form.vissionBodyColor || null,
        missionBodyColor: form.missionBodyColor || null,
        valueBodyColor: form.valueBodyColor || null,
        vissionHeadingColor: form.vissionHeadingColor || null,
        missionHeadingColor: form.missionHeadingColor || null,
        valueHeadingColor: form.valueHeadingColor || null,
        vissionOpacity: form.vissionOpacity || null,
        missionOpacity: form.missionOpacity || null,
        valueOpacity: form.valueOpacity || null,
      };

      await companyAction(payload);
      toast.success(isEdit ? 'Updated successfully' : 'Saved successfully');
      setModalOpen(false);
      loadCompanies();
    } catch (e) {
      toast.error('Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCompany = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await companyAction({ action: 'DELETE', id: deleteConfirm });
      toast.success('Deleted successfully');
      setDeleteConfirm(null);
      loadCompanies();
    } catch (e) {
      toast.error('Failed to delete company');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-4 my-5">
      <h1 className="text-center mt-4 mb-3 fw-bold">Company</h1>

      {loading ? (
        <div className="text-center py-4">
          <i className="fa fa-spinner fa-spin fa-2x text-muted" />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="row m-0 mb-3">
            <div className="col-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-8 text-end">
              <button className="btn btn-secondary btn-sm" onClick={openAdd}>
                Add Company
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="row m-0">
            <div className="col-12">
              <div className="table-responsive">
                <table className="table table-bordered table-hover table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>URL</th>
                      <th>Logo</th>
                      <th>Vision</th>
                      <th>Mission</th>
                      <th>Values</th>
                      <th>Token</th>
                      <th style={{ width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-3">
                          No records found
                        </td>
                      </tr>
                    ) : filtered.map((company, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{company.name}</td>
                        <td>
                          <a href={company.url} target="_blank" rel="noreferrer" style={{ color: '#0197cc' }}>
                            {company.url}
                          </a>
                        </td>
                        <td>
                          {company.logoUrl && (
                            <img src={company.logoUrl} alt={company.name} style={{ height: 30, maxWidth: 80, objectFit: 'contain' }} />
                          )}
                        </td>
                        <td>
                          <div
                            style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            dangerouslySetInnerHTML={{ __html: decodeHTML(company.vision || '') }}
                          />
                        </td>
                        <td>
                          <div
                            style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            dangerouslySetInnerHTML={{ __html: decodeHTML(company.mission || '') }}
                          />
                        </td>
                        <td>
                          <div
                            style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            dangerouslySetInnerHTML={{ __html: decodeHTML(company.values || company.companyValues || '') }}
                          />
                        </td>
                        <td style={{ fontSize: 12, color: '#989898' }}>{company.token}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <div
                              className="editiconbg meetlistedit"
                              style={{ cursor: 'pointer', display: 'inline-block' }}
                              onClick={() => openEdit(company)}
                              title="Edit"
                            />
                            <div
                              className="trashiconbg meetlistedit"
                              style={{ cursor: 'pointer', display: 'inline-block' }}
                              onClick={() => setDeleteConfirm(company.companyId || company.id)}
                              title="Delete"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 860, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "16px 24px", borderBottom: "1px solid #dee2e6", flexShrink: 0 }}>
                <h5 className="modal-title">
                  {isEdit ? 'Edit Company' : 'Add New Company'}
                </h5>
              </div>
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <form autoComplete="off">
                  {/* Company Name */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Company Name <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9">
                      <input
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Company URL */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Company URL <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9">
                      <input
                        type="text"
                        className="form-control"
                        value={form.url}
                        onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">Company Logo</label>
                    <div className="col-md-9 d-flex align-items-center gap-3">
                      <span className="file-wrapper">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={onLogoSelect}
                        />
                        <span className="button">Upload Logo</span>
                      </span>
                      {form.logoPreview && (
                        <img src={form.logoPreview} alt="logo" style={{ maxWidth: 200, maxHeight: 60, objectFit: 'contain' }} />
                      )}
                    </div>
                  </div>

                  {/* Vision */}
                  <div className="row mb-3 align-items-start">
                    <label className="col-md-3 col-form-label fw-bold">Vision</label>
                    <div className="col-md-9">
                      <VMVEditor
                        label="VISION"
                        text={form.vision}
                        onTextChange={(v) => setForm(p => ({ ...p, vision: v }))}
                        bgColor={form.vissionBodyColor}
                        onBgColorChange={(v) => setForm(p => ({ ...p, vissionBodyColor: v }))}
                        headingColor={form.vissionHeadingColor}
                        onHeadingColorChange={(v) => setForm(p => ({ ...p, vissionHeadingColor: v }))}
                        opacity={form.vissionOpacity}
                        onOpacityChange={(v) => setForm(p => ({ ...p, vissionOpacity: v }))}
                      />
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="row mb-3 align-items-start">
                    <label className="col-md-3 col-form-label fw-bold">Mission</label>
                    <div className="col-md-9">
                      <VMVEditor
                        label="MISSION"
                        text={form.mission}
                        onTextChange={(v) => setForm(p => ({ ...p, mission: v }))}
                        bgColor={form.missionBodyColor}
                        onBgColorChange={(v) => setForm(p => ({ ...p, missionBodyColor: v }))}
                        headingColor={form.missionHeadingColor}
                        onHeadingColorChange={(v) => setForm(p => ({ ...p, missionHeadingColor: v }))}
                        opacity={form.missionOpacity}
                        onOpacityChange={(v) => setForm(p => ({ ...p, missionOpacity: v }))}
                      />
                    </div>
                  </div>

                  {/* Values */}
                  <div className="row mb-3 align-items-start">
                    <label className="col-md-3 col-form-label fw-bold">Values</label>
                    <div className="col-md-9">
                      <VMVEditor
                        label="VALUES"
                        text={form.values}
                        onTextChange={(v) => setForm(p => ({ ...p, values: v }))}
                        bgColor={form.valueBodyColor}
                        onBgColorChange={(v) => setForm(p => ({ ...p, valueBodyColor: v }))}
                        headingColor={form.valueHeadingColor}
                        onHeadingColorChange={(v) => setForm(p => ({ ...p, valueHeadingColor: v }))}
                        opacity={form.valueOpacity}
                        onOpacityChange={(v) => setForm(p => ({ ...p, valueOpacity: v }))}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div style={{ padding: "12px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={onSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? <i className="fa fa-spinner fa-spin" />
                    : isEdit ? 'Update' : 'Save'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1060, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 500, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <p>
                  Are you sure you want to delete this company? It will also delete all the
                  users and their goal plans. Once deleted it can&apos;t be undone.
                </p>
              </div>
              <div style={{ padding: "12px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={deleteCompany}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <i className="fa fa-spinner fa-spin" /> : 'Ok'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

// ─── Vision / Mission / Values card editor ───────────────────────────────────
function VMVEditor({ label, text, onTextChange, bgColor, onBgColorChange, headingColor, onHeadingColorChange, opacity, onOpacityChange }) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className="bg-blue-img company-card"
      style={{
        border: '1px solid #dee2e6',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 120,
      }}
    >
      {/* Card header */}
      <div
        className="px-3 py-2 d-flex align-items-center justify-content-between"
        style={{
          background: '#fff',
          borderBottom: '1px solid #dee2e6',
        }}
      >
        <h6 className="m-0 text-uppercase fw-bold" style={{ color: headingColor ? `#${headingColor}` : '#6B3FA0' }}>
          <span style={{ fontSize: 18 }}>{label.charAt(0)}</span>
          {label.slice(1).toLowerCase()}
        </h6>
        <div className="d-flex gap-2 align-items-center">
          {/* Body color */}
          <label style={{ fontSize: 11, color: '#989898', marginBottom: 0 }}>
            Color:
            <input
              type="color"
              value={bgColor ? `#${bgColor}` : '#000000'}
              onChange={(e) => onBgColorChange(e.target.value.replace('#', ''))}
              style={{ width: 24, height: 18, border: 'none', padding: 0, marginLeft: 4, cursor: 'pointer' }}
            />
          </label>
          {/* Heading color */}
          <label style={{ fontSize: 11, color: '#989898', marginBottom: 0 }}>
            Heading:
            <input
              type="color"
              value={headingColor ? `#${headingColor}` : '#6B3FA0'}
              onChange={(e) => onHeadingColorChange(e.target.value.replace('#', ''))}
              style={{ width: 24, height: 18, border: 'none', padding: 0, marginLeft: 4, cursor: 'pointer' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            style={{ fontSize: 11, padding: '1px 8px' }}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-3 py-2" style={{ color: bgColor ? `#${bgColor}` : undefined }}>
        {editing ? (
          <textarea
            className="form-control"
            rows={4}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()} text (HTML supported)`}
            style={{ fontSize: 13 }}
          />
        ) : (
          <div
            style={{ fontSize: 13, minHeight: 60 }}
            dangerouslySetInnerHTML={{ __html: text || `<em style="color:#aaa">No ${label.toLowerCase()} text</em>` }}
          />
        )}
      </div>

      {/* Opacity slider */}
      {opacity !== undefined && (
        <div className="px-3 pb-2 d-flex align-items-center gap-2">
          <span style={{ fontSize: 11, color: '#989898' }}>Opacity:</span>
          <input
            type="range" min="0" max="1" step="0.1"
            value={opacity || 1}
            onChange={(e) => onOpacityChange(e.target.value)}
            style={{ flex: 1, height: 6 }}
          />
          <span style={{ fontSize: 11, color: '#989898', minWidth: 28 }}>
            {opacity || 1}
          </span>
        </div>
      )}
    </div>
  );
}
