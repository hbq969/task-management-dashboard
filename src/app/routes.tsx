import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);