import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";


type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  const isAuthenticated =
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token.trim() !== "";

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
