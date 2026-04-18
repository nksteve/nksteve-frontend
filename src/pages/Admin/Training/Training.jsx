import React, { useEffect, useRef, useState } from 'react';
import SlickSlider from 'react-slick';
const Slider = SlickSlider.default || SlickSlider;
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  trainingTabs, trainingList, trainingPlans, trainingSave,
  trainingDelete, trainingCategory, getPicklist,
} from '../../../api/client';
import { toast } from 'react-toastify';

const sliderSettings = {
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  swipeToSlide: true,
};

const lineClamp = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  width: '100%',
  textOverflow: 'ellipsis',
};

function getDocIcon(fileName) {
  if (!fileName) return null;
  const ext = fileName.split('.').pop().toLowerCase();
  const icons = { pdf: '📄', xlsx: '📊', pptx: '📝', docx: '📃' };
  return icons[ext] || '📎';
}

export default function Training() {
  const user = JSON.parse(localStorage.getItem('onup_user') || '{}');
  const entityId = user.entityId;
  const companyId = user.companyId;
  const isAdmin = user.securityToken >= 1;
  const isSuperAdmin = user.securityToken === 2;

  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyList, setCompanyList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [growthPlanList, setGrowthPlanList] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    videoLink: '',
    category: '',
    categoryId: '',
    companyId: '',
    growthPlanId: '',
    imageFile: null,
    imagePreview: null,
    existingThumbnail: '',
    docs: [],
  });
  const [errors, setErrors] = useState({});
  const [docUploading, setDocUploading] = useState(false);

  // Category management popup
  const [catPopup, setCatPopup] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, name: '', orderBy: '' });
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null); // trainingId
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  const sliderRef = useRef();

  useEffect(() => {
    loadTabs();
    loadCategories();
    if (isSuperAdmin) loadCompanies();
  }, []);

  const loadTabs = async () => {
    try {
      const res = await trainingTabs({ entityId, companyId });
      const data = res.data?.result || [];
      setTabs(data.map(d => d.tab));
      if (data.length > 0) {
        loadList(data[0].tab);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  };

  const loadList = async (tab) => {
    setLoading(true);
    try {
      const res = await trainingList({ entityId, companyId, tab });
      setList(res.data?.result || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await trainingCategory({ action: 'GET', entityId });
      setCategoryList(res.data?.result || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await getPicklist({ picklistType: 'COMPANY' });
      setCompanyList(res.data?.picklist || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGrowthPlans = async (cId) => {
    if (!cId) { setGrowthPlanList([]); return; }
    try {
      const res = await trainingPlans({ entityId, companyId: cId });
      setGrowthPlanList(res.data?.result || []);
    } catch (e) {
      console.error(e);
    }
  };

  const onTabChange = (i, tabName) => {
    setActiveTab(i);
    setList([]);
    loadList(tabName);
    sliderRef.current?.slickGoTo(i);
  };

  const openAdd = () => {
    setForm({
      id: null, name: '', videoLink: '', category: '', categoryId: '',
      companyId: isSuperAdmin ? '' : String(companyId),
      growthPlanId: '', imageFile: null, imagePreview: null,
      existingThumbnail: '', docs: [],
    });
    setErrors({});
    setIsEdit(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    const docs = [
      item.docId1 ? { id: item.docId1, fileName: item.docName1, fileLocation: item.docUrl1 } : null,
      item.docId2 ? { id: item.docId2, fileName: item.docName2, fileLocation: item.docUrl2 } : null,
      item.docId3 ? { id: item.docId3, fileName: item.docName3, fileLocation: item.docUrl3 } : null,
    ].filter(Boolean);

    setForm({
      id: item.id,
      name: item.name || '',
      videoLink: item.videoLink || '',
      category: item.tab || '',
      categoryId: item.categoryId || '',
      companyId: item.companyId ? String(item.companyId) : '',
      growthPlanId: item.planId ? String(item.planId) : '',
      imageFile: null,
      imagePreview: null,
      existingThumbnail: item.thumbnailUrl || '',
      docs,
    });
    if (item.companyId) loadGrowthPlans(item.companyId);
    setErrors({});
    setIsEdit(true);
    setModalOpen(true);
  };

  const onFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'companyId') {
      loadGrowthPlans(value);
      setForm(prev => ({ ...prev, companyId: value, growthPlanId: '' }));
    }
    if (field === 'category') {
      const cat = categoryList.find(c => c.category_name === value);
      setForm(prev => ({ ...prev, category: value, categoryId: cat ? cat.categoryId : '' }));
    }
  };

  const onImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
    e.target.value = null;
  };

  const onDocSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (form.docs.length >= 3) {
      toast.warning("You can't add more than 3 attachments");
      return;
    }
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityId', entityId);
      fd.append('type', 'HowTo');
      const token = localStorage.getItem('onup_token');
      const res = await fetch('/api/fileUpload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.Location) {
        setForm(prev => ({
          ...prev,
          docs: [...prev.docs, { fileName: file.name, fileLocation: data.Location }],
        }));
      }
    } catch (err) {
      toast.error('Failed to upload attachment');
    } finally {
      setDocUploading(false);
    }
    e.target.value = null;
  };

  const removeDoc = (i) => {
    setForm(prev => {
      const docs = [...prev.docs];
      docs.splice(i, 1);
      return { ...prev, docs };
    });
  };

  const onSubmit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Please enter Name';
    if (!form.category) errs.category = 'Please enter Category';
    if (!form.videoLink.trim()) errs.videoLink = 'Please enter Link';
    if (!form.imageFile && !form.existingThumbnail) errs.file = 'Please upload thumbnail';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('action', isEdit ? 'UPDATE' : 'INSERT');
      fd.append('tab', form.category);
      fd.append('categoryId', form.categoryId || '');
      fd.append('videoLink', form.videoLink);
      fd.append('name', form.name);
      fd.append('entityId', entityId);
      if (form.companyId) fd.append('companyId', form.companyId);
      if (form.growthPlanId) fd.append('growthPlanId', form.growthPlanId);
      if (isEdit && form.id) fd.append('trainingId', form.id);
      if (form.imageFile) fd.append('image', form.imageFile);
      if (form.existingThumbnail && !form.imageFile) fd.append('thumbnailUrl', form.existingThumbnail);

      // Pass existing doc IDs
      form.docs.forEach((doc, i) => {
        if (doc.id) fd.append(`doc${i + 1}Id`, doc.id);
      });

      const token = localStorage.getItem('onup_token');
      await fetch('/api/training/save', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      toast.success(isEdit ? 'Updated successfully' : 'Saved successfully');
      setModalOpen(false);
      loadTabs();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item) => {
    try {
      await trainingDelete({ trainingId: item.id, entityId });
      toast.success('Deleted successfully');
      setDeleteConfirm(null);
      loadTabs();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const redirectURL = (url) => {
    if (!url) return;
    if (url.match(/\.(docx|pptx)$/i)) {
      window.open(`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(url)}&embedded=true`);
    } else {
      if (url.includes('www.') && !url.includes('https')) {
        window.open(url.replace('www.', 'https://'));
      } else {
        window.open(url);
      }
    }
  };

  // ─── Category management ─────────────────────────────────────────────────
  const openCatPopup = () => {
    setCatForm({ id: null, name: '', orderBy: '' });
    setCatPopup(true);
  };

  const saveCat = async (cat) => {
    setCatSubmitting(true);
    try {
      const isNew = !cat.id;
      await trainingCategory({
        action: isNew ? 'INSERT' : 'UPDATE',
        id: cat.id || null,
        name: cat.name,
        entityId,
        orderBy: cat.orderBy || null,
      });
      toast.success(isNew ? 'Category added' : 'Category updated');
      loadCategories();
      loadTabs();
    } catch (e) {
      toast.error('Failed to save category');
    } finally {
      setCatSubmitting(false);
    }
  };

  const deleteCat = async (id) => {
    try {
      await trainingCategory({ action: 'DELETE', id, entityId });
      toast.success('Category deleted');
      setDeleteCatConfirm(null);
      loadCategories();
      loadTabs();
    } catch (e) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="training mx-4 my-5">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
        <h1 className="m-0">How To</h1>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>Add</button>
        )}
      </div>

      <div className="gray-box">
        {/* Tabs with slider */}
        <nav>
          <div className="nav nav-tabs w-100" style={{ borderBottom: '1px solid #dee2e6' }}>
            {tabs.length > 0 ? (
              <Slider {...sliderSettings} className="trainingslider w-100" ref={sliderRef}>
                {tabs.map((tab, i) => (
                  <div key={i}>
                    <div
                      className={`nav-item`}
                      style={{ display: 'inline-block', width: '100%' }}
                    >
                      <button
                        className={`nav-link${activeTab === i ? ' active' : ''}`}
                        style={{
                          textAlign: 'center', width: '100%', border: 'none',
                          background: 'none', cursor: 'pointer',
                          color: activeTab === i ? '#0197cc' : '#495057',
                          borderBottom: activeTab === i ? '2px solid #0197cc' : 'none',
                          fontWeight: activeTab === i ? 600 : 400,
                          padding: '8px 12px',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        onClick={() => onTabChange(i, tab)}
                      >
                        {tab}
                      </button>
                    </div>
                  </div>
                ))}
              </Slider>
            ) : null}
          </div>
        </nav>

        {/* Content */}
        {loading ? (
          <div className="text-center py-4">
            <i className="fa fa-spinner fa-spin fa-2x text-muted" />
          </div>
        ) : list.length === 0 ? (
          <div className="no-record text-center py-4">
            <span>No records found</span>
          </div>
        ) : (
          <div className="row mt-3">
            {list.map((item, key) => (
              <div key={key} className="col-sm-6 col-lg-4 col-xl-3 mb-3">
                <div className="card h-100">
                  <div className="card-body p-0">
                    <div
                      className="cursor"
                      style={{ width: '100%', cursor: 'pointer' }}
                      onClick={() => redirectURL(item.videoLink)}
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          className="card-img-top"
                          alt={item.name}
                          style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '140px', background: '#f4f5fa',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#989898', fontSize: 32,
                        }}>
                          <i className="fa fa-play-circle" />
                        </div>
                      )}
                    </div>
                    <div className="px-3 pt-2 pb-3">
                      <p
                        className="mb-1 fw-semibold"
                        style={{ ...lineClamp, fontSize: 14 }}
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {/* Growth plan link */}
                      {item.planName && (
                        <div
                          style={{ fontSize: 13, color: '#989898', marginBottom: 4,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {item.planName}
                        </div>
                      )}
                      {/* Attachments */}
                      <div className="d-flex gap-2 flex-wrap">
                        {item.docId1 && (
                          <span
                            style={{ fontSize: 12, cursor: 'pointer', color: '#0197cc' }}
                            onClick={() => redirectURL(item.docUrl1)}
                            title={item.docName1}
                          >
                            {getDocIcon(item.docName1)} {item.docName1}
                          </span>
                        )}
                        {item.docId2 && (
                          <span
                            style={{ fontSize: 12, cursor: 'pointer', color: '#0197cc' }}
                            onClick={() => redirectURL(item.docUrl2)}
                            title={item.docName2}
                          >
                            {getDocIcon(item.docName2)} {item.docName2}
                          </span>
                        )}
                        {item.docId3 && (
                          <span
                            style={{ fontSize: 12, cursor: 'pointer', color: '#0197cc' }}
                            onClick={() => redirectURL(item.docUrl3)}
                            title={item.docName3}
                          >
                            {getDocIcon(item.docName3)} {item.docName3}
                          </span>
                        )}
                      </div>
                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="d-flex align-items-center justify-content-between mt-2">
                          <span style={{ fontSize: 12, color: 'green' }} title={item.companyName}>
                            {item.companyName || 'Public'}
                          </span>
                          <div>
                            <i
                              className="fa fa-pencil cursor me-2"
                              style={{ color: '#0197cc', cursor: 'pointer' }}
                              onClick={() => openEdit(item)}
                              title="Edit"
                            />
                            <i
                              className="fa fa-trash cursor"
                              style={{ color: 'red', cursor: 'pointer' }}
                              onClick={() => setDeleteConfirm(item)}
                              title="Delete"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 860, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "16px 24px", borderBottom: "1px solid #dee2e6", flexShrink: 0 }}>
                <h5 className="modal-title">{isEdit ? 'Edit Training' : 'Add Training'}</h5>
              </div>
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <form autoComplete="off">
                  {/* Category */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Category <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9">
                      <div className="d-flex gap-2 align-items-center">
                        <select
                          className="form-control"
                          value={form.category}
                          onChange={(e) => onFormChange('category', e.target.value)}
                        >
                          <option value="">Select Category</option>
                          {categoryList.map(c => (
                            <option key={c.categoryId} value={c.category_name}>{c.category_name}</option>
                          ))}
                        </select>
                        {isSuperAdmin && (
                          <i
                            className="fa fa-pencil"
                            style={{ cursor: 'pointer', color: '#0197cc', marginTop: 2 }}
                            onClick={openCatPopup}
                            title="Manage Categories"
                          />
                        )}
                      </div>
                      {errors.category && <small className="text-danger">{errors.category}</small>}
                    </div>
                  </div>

                  {/* Company (superAdmin only) */}
                  {isSuperAdmin && (
                    <div className="row mb-3 align-items-center">
                      <label className="col-md-3 col-form-label fw-bold">Company</label>
                      <div className="col-md-9">
                        <select
                          className="form-control"
                          value={form.companyId}
                          onChange={(e) => onFormChange('companyId', e.target.value)}
                        >
                          <option value="">Select Company</option>
                          {companyList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Name <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9">
                      <input
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(e) => onFormChange('name', e.target.value)}
                        placeholder="Only 80 characters"
                        maxLength={80}
                      />
                      {errors.name && <small className="text-danger">{errors.name}</small>}
                    </div>
                  </div>

                  {/* Video Link */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Link <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9">
                      <input
                        type="text"
                        className="form-control"
                        value={form.videoLink}
                        onChange={(e) => onFormChange('videoLink', e.target.value)}
                      />
                      {errors.videoLink && <small className="text-danger">{errors.videoLink}</small>}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">
                      Thumbnail <sup className="text-danger">*</sup>
                    </label>
                    <div className="col-md-9 d-flex align-items-center gap-3">
                      <span className="file-wrapper">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={onImageSelect}
                        />
                        <span className="button">Upload</span>
                      </span>
                      <div>
                        {form.imagePreview && (
                          <img src={form.imagePreview} alt="preview" style={{ height: 60 }} />
                        )}
                        {!form.imagePreview && form.existingThumbnail && (
                          <img src={form.existingThumbnail} alt="thumbnail" style={{ height: 60 }} />
                        )}
                      </div>
                    </div>
                    {errors.file && <small className="text-danger ms-3">{errors.file}</small>}
                  </div>

                  {/* Attachments */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">Attachment</label>
                    <div className="col-md-9 d-flex align-items-start gap-3 flex-wrap">
                      <span className="file-wrapper">
                        <input
                          type="file"
                          accept=".pdf,.pptx,.docx,.xlsx"
                          onChange={onDocSelect}
                        />
                        {docUploading ? (
                          <i className="fa fa-spinner fa-spin button" style={{ fontSize: 10 }} />
                        ) : (
                          <span className="button">Upload</span>
                        )}
                      </span>
                      <div className="d-flex gap-2 flex-wrap">
                        {form.docs.map((doc, i) => doc.fileName && (
                          <div key={i} style={{ width: 80 }} className="text-center position-relative">
                            <span style={{ fontSize: 28 }}>{getDocIcon(doc.fileName)}</span>
                            <p style={{ fontSize: 11, marginBottom: 0 }} className="text-wrap text-center">
                              {doc.fileName}
                            </p>
                            <i
                              className="fa fa-times-circle position-absolute"
                              style={{ top: -8, right: 0, color: 'red', cursor: 'pointer', fontSize: 16 }}
                              onClick={() => removeDoc(i)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Link to Goal Plan */}
                  <div className="row mb-3 align-items-center">
                    <label className="col-md-3 col-form-label fw-bold">Link to Goal Plan</label>
                    <div className="col-md-9">
                      <select
                        className="form-control"
                        value={form.growthPlanId}
                        onChange={(e) => onFormChange('growthPlanId', e.target.value)}
                        disabled={!form.companyId}
                      >
                        <option value="">Select Plan</option>
                        {growthPlanList.map(p => (
                          <option key={p.growthPlanId} value={p.growthPlanId}>{p.name}</option>
                        ))}
                      </select>
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
                  {submitting ? <i className="fa fa-spinner fa-spin" /> : 'Submit'}
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

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1060, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 500, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <p>Are you sure you want to delete this item? This cannot be undone.</p>
              </div>
              <div style={{ padding: "12px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(deleteConfirm)}>Ok</button>
                <button className="btn btn-primary btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
      )}

      {/* Category Management Popup */}
      {catPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1070, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 860, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "16px 24px", borderBottom: "1px solid #dee2e6", flexShrink: 0 }}>
                <h5 className="modal-title">Manage Categories</h5>
              </div>
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                {/* Add new category */}
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Category name"
                    value={catForm.name}
                    onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value, id: null }))}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Order"
                    style={{ width: 80 }}
                    value={catForm.orderBy}
                    onChange={(e) => setCatForm(p => ({ ...p, orderBy: e.target.value }))}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!catForm.name.trim() || catSubmitting}
                    onClick={() => {
                      saveCat(catForm);
                      setCatForm({ id: null, name: '', orderBy: '' });
                    }}
                  >
                    {catForm.id ? 'Update' : 'Add'}
                  </button>
                </div>

                {/* Category list */}
                <table className="table table-sm table-bordered">
                  <thead><tr><th>Name</th><th>Order</th><th style={{ width: 80 }}>Actions</th></tr></thead>
                  <tbody>
                    {categoryList.map(cat => (
                      <tr key={cat.categoryId}>
                        <td>{cat.category_name}</td>
                        <td>{cat.orderBy}</td>
                        <td>
                          <i
                            className="fa fa-pencil me-2"
                            style={{ cursor: 'pointer', color: '#0197cc' }}
                            onClick={() => setCatForm({ id: cat.categoryId, name: cat.category_name, orderBy: cat.orderBy || '' })}
                          />
                          <i
                            className="fa fa-trash"
                            style={{ cursor: 'pointer', color: 'red' }}
                            onClick={() => setDeleteCatConfirm(cat.categoryId)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "12px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setCatPopup(false)}>Close</button>
              </div>
            </div>
          </div>
      )}

      {/* Delete Category Confirm */}
      {deleteCatConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1080, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 8, maxWidth: 500, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                <p>
                  You are about to delete this Category. Deleting the Category will delete all
                  videos under this category and cannot be undone. Would you like to continue?
                </p>
              </div>
              <div style={{ padding: "12px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-danger btn-sm" onClick={() => deleteCat(deleteCatConfirm)}>Ok</button>
                <button className="btn btn-primary btn-sm" onClick={() => setDeleteCatConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
