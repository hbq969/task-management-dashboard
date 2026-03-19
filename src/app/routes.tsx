import { createHashRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { NotFound } from "./components/NotFound";

export const router = createHashRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);