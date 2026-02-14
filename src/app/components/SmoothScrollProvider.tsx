"use client"

import { useEffect } from "react"
import Lenis from "@studio-freight/lenis"

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.documentElement.classList.add('lenis')

        const lenis = new Lenis({
            duration: 1.2, 
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical", 
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            syncTouch: false,
            touchMultiplier: 2,
            infinite: false,
        })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            document.documentElement.classList.remove('lenis')
            lenis.destroy()
        }
    }, [])

    return <>{children}</>
}

