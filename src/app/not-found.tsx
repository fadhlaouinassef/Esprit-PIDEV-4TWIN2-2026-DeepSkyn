"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import "./css/not-found.css"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden relative">
      <div className="text-center space-y-8 max-w-2xl mx-auto z-10">
        {/* Glitchy 404 Text */}
        <div className="relative">
          <h1 className="text-9xl md:text-[12rem] font-black glitch-text select-none text-transparent">404</h1>
          <h1 className="absolute inset-0 text-9xl md:text-[12rem] font-black glitch-text-shadow select-none text-slate-100">
            404
          </h1>
          <h1 className="absolute inset-0 text-9xl md:text-[12rem] font-black glitch-text-shadow-2 select-none text-neutral-900">
            404
          </h1>
        </div>

        {/* Glitchy Message */}
        <div className="space-y-4">
          <p className="text-xl md:text-2xl glitch-message font-extralight text-neutral-500">This page fell into the void.</p>

        </div>

        {/* Glitchy Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => window.history.back()}
            size="lg"
            className="hover:bg-neutral-950 bg-neutral-900 text-neutral-100 border border-neutral-800"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </div>
          </Button>

          <Button size="lg" className="hover:bg-neutral-950 bg-neutral-900 text-neutral-100 border border-neutral-800 p-0">
            <Link href="/" className="flex items-center gap-2 px-8 h-full w-full">
              <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Glitch Lines Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
        <div className="glitch-line glitch-line-1"></div>
        <div className="glitch-line glitch-line-2"></div>
      </div>
    </div>
  )
}
