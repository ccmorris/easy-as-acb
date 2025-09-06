"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignInForm, SignOutButton } from "./components/Auth";
import { PortfolioList } from "./components/PortfolioList";
import { SecurityList } from "./components/SecurityList";
import { SecurityDetail } from "./components/SecurityDetail";

export default function App() {
  return (
    <BrowserRouter>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Canadian ACB Tracker</h1>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>
      <main className="p-8 flex flex-col gap-16">
        <Authenticated>
          <Routes>
            <Route path="/" element={<PortfolioList />} />
            <Route path="/portfolio/:portfolioId" element={<SecurityList />} />
            <Route
              path="/portfolio/:portfolioId/security/:securityId"
              element={<SecurityDetail />}
            />
          </Routes>
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </BrowserRouter>
  );
}
