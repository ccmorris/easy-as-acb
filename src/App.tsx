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
      <header className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 flex-row items-center gap-2 flex">
            <img src="/favicon.png" alt="Easy as ACB" className="w-8 h-8" />{" "}
            Easy as ACB
          </h1>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>
      <main className="p-8 flex flex-col gap-16 bg-white min-h-screen">
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
