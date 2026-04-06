import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { syncspaceApi } from "./api/syncspaceApi";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [syncspaceApi.reducerPath]: syncspaceApi.reducer,
    },
    middleware: (gDM) => gDM().concat(syncspaceApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
