import axios from 'axios';

const BASE = '/api';

export const http = axios.create({ baseURL: BASE });

http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('onup_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('onup_token');
      localStorage.removeItem('onup_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const login = (data) => http.post('/login', data);
export const forgotPassword = (data) => http.post('/forgot-password', data);
export const changePassword = (data) => http.post('/change-password', data);

// Growth Plans
export const getGrowthPlanDetails = (data) => http.post('/growth-plan-details', data);
export const newGrowthPlan = (data) => http.post('/newGrowthPlan', data);
export const updateGrowthPlan = (data) => http.post('/updateGrowthplanSummary', data);
export const updateGoal = (data) => http.post('/updateGoal', data);
export const updateAction = (data) => http.post('/updateAction', data);
export const updateActionProgress = (data) => http.post('/updateActionProgress', data);
export const updatePlansOrder = (data) => http.post('/updatePlansOrder', data);
export const updateGoalsOrder = (data) => http.post('/updateGoalsOrder', data);
export const updateActionsOrder = (data) => http.post('/updateActionsOrder', data);
export const getCGPNotes = (data) => http.post('/cgp-notes', data);
export const getTemplates = (data) => http.post('/getTemplates', data);
export const moveTemplates = (data) => http.post('/moveTemplates', data);
export const getCGPPlanByContributor = (data) => http.post('/getCGPGrowthPlanByContributor', data);
export const addCGPContributor = (data) => http.post('/addCGPContributor', data);
export const updateCGPflag = (data) => http.post('/updateCGPflag', data);
export const getTimebankTemplate = (data) => http.post('/getTimebankTemplate', data);

// Meetings
export const getMeetings = (data) => http.post('/getMeetings', data);
export const getMeetingsCalendar = (data) => http.post('/getMeetingsCalendar', data);
export const getMeetingDetail = (data) => http.post('/getMeetingsDetail', data);
export const getMeetingsByGrowthPlan = (data) => http.post('/getMeetingsDetailByGrowthPlanId', data);
export const updateMeeting = (data) => http.post('/updateMeeting', data);
export const getFeedback = (data) => http.post('/getFeedback', data);
export const updateFeedback = (data) => http.post('/updateFeedback', data);

// Users / Profile
export const getEntitySetup = (id) => http.get(`/getEntitySetup/${id}`);
export const getEntityBio = (id) => http.get(`/getEntityBio/${id}`);
export const getEntityExperience = (id) => http.get(`/getEntityExperience/${id}`);
export const getEntityInterests = (id) => http.get(`/getEntityInterests/${id}`);
export const getEntityPersonal = (id) => http.get(`/getEntityPersonal/${id}`);
export const updateEntityBio = (data) => http.post('/updateEntityBio', data);
export const updateEntityInterests = (data) => http.post('/updateEntityInterestsTag', data);
export const updateEntityExperience = (data) => http.post('/updateEntityExperience', data);
export const updateEntityPersonal = (data) => http.post('/updateEntityPersonal', data);
export const getAdminUsers = (data) => http.post('/getAdminUsers', data);
export const getEntityUser = (data) => http.post('/getEntityUser', data);
export const deleteUser = (data) => http.post('/deleteUserByEntityId', data);
export const getAllContributors = (data) => http.post('/cgp_getAllContributors', data);
export const getEntityOrgReporting = (data) => http.post('/getEntityOrgReporting', data);
export const getEntityActivityLog = (data) => http.post('/getEntityActivityLog', data);
export const updateCompany = (data) => http.post('/updateCompany', data);

// Reports & Analytics
export const getReport = (data) => http.post('/reports', data);
export const getReportDirect = (data) => http.post('/getReport', data);
export const goalPlanReport = (data) => http.post('/goalPlanReport', data);
export const goaltreeStructure = (data) => http.post('/goaltreeStructure', data);
export const getAnalyticsCompany = (data) => http.post('/analyticsCompany', data);
export const getAnalyticsData = (data) => http.post('/analyticsData', data);
export const getAnalyticsConfig = (data) => http.post('/analyticsConfig', data);
export const companyMapping = (data) => http.post('/companyMapping', data);

// Notifications
export const getNotifications = (data) => http.post('/getNotifications', data);
export const getNotification = (data) => http.post('/getNotification', data);
export const getEntityDisplayActivity = (data) => http.post('/getEntityDisplayActivity', data);

// ThoughtPad
export const getThoughtpad    = (data) => http.post('/getThoughtpads',    data);
export const updateThoughtpad = (data) => http.post('/updateThoughtpad',  data);
export const insertThoughtpad = (data) => http.post('/insertThoughtpad',  data);
export const deleteThoughtpad = (data) => http.post('/deleteThoughtpad',  data);

// Tags & Picklist
export const getCategories = () => http.get('/getCategories');
export const getTags = (data) => http.post('/getTags', data);
export const getPicklist = (data) => http.post('/getPicklist', data);
export const updateCustomizedTag = (data) => http.post('/updateCustomizedTag', data);
export const goalActionCreate = (data) => http.post('/goalActionCreate', data);

// Training
export const getTraining = (data) => http.post('/training', data);
export const deleteTraining = (data) => http.post('/deleteTrainingdoc', data);
export const updateTrainingCategory = (data) => http.post('/trainingCategory', data);

// Cron Management
export const cronSettings = (data) => http.post('/cronsettings', data);

// SFTP Management
export const sftpAdmin = (data) => http.post('/sftpAdmin', data);
export const sftpUser = (data) => http.post('/sftpUser', data);
export const createSftpUser = (data) => http.post('/createSftpUser', data);

// Company Management
export const getCompanyList = (data) => http.post('/getPicklist', data);
export const companyAction = (data) => http.post('/company', data);
export const uploadCompanyFile = (data) => http.post('/company/upload', data);

// Training (new granular routes)
export const trainingTabs = (data) => http.post('/training/tabs', data);
export const trainingList = (data) => http.post('/training/list', data);
export const trainingPlans = (data) => http.post('/training/plans', data);
export const trainingSave = (data, config) => http.post('/training/save', data, config);
export const trainingDelete = (data) => http.post('/training/delete', data);
export const trainingCategory = (data) => http.post('/training/category', data);

// Preferences
export const updatePreferences = (data) => http.post('/preferences', data);

export const getMyPlans = (data) => http.post('/getMyPlans', data);

// Notes & Documents
export const updateGoalActionNotes = (data) => http.post('/updateGoalActionNotes', data);
export const updateGoalfile        = (data) => http.post('/updateGoalfile', data);
export const updateEntityActivity = (data) => http.post('/updateEntityActivity', data);

export default http;
