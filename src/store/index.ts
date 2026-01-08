import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from './services/authApi';
import { userApi } from './services/userApi';
import { roleApi } from './services/roleApi';
import { ticketApi } from './services/ticketApi';
import { reprintRequestApi } from './services/reprintRequestApi';
import { workflowApi } from './services/workflowApi';
import { approvalProgressApi } from './services/approvalProgressApi';
import { reviewApi } from './services/reviewApi';
import { reportApi } from './services/reportApi';
import { systemApi } from './services/systemApi';
import authReducer from './features/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [reprintRequestApi.reducerPath]: reprintRequestApi.reducer,
    [workflowApi.reducerPath]: workflowApi.reducer,
    [approvalProgressApi.reducerPath]: approvalProgressApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [systemApi.reducerPath]: systemApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(roleApi.middleware)
      .concat(ticketApi.middleware)
      .concat(reprintRequestApi.middleware)
      .concat(workflowApi.middleware)
      .concat(approvalProgressApi.middleware)
      .concat(reviewApi.middleware)
      .concat(reportApi.middleware)
      .concat(systemApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector;
