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
      <header className="sticky top-0 z-10 gradient-subtle-bg border-b border-gray-200 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <img src="/favicon.png" alt="Easy as ACB" className="w-8 h-8" />
              Easy as ACB
            </h1>
            <Authenticated>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
