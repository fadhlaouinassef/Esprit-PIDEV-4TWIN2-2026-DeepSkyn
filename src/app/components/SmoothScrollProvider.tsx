"use client"

import { useEffect } from "react"
import Lenis from "@studio-freight/lenis"

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Ajouter la classe lenis au HTML
        document.documentElement.classList.add('lenis')

        // Initialiser Lenis pour un scroll ultra smooth
        const lenis = new Lenis({
            duration: 1.2, // Durée de l'animation de scroll (plus c'est élevé, plus c'est smooth)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Fonction d'easing personnalisée
            orientation: "vertical", // Direction du scroll
            gestureOrientation: "vertical",
            smoothWheel: true, // Activer le smooth scroll avec la molette
            wheelMultiplier: 1, // Multiplicateur de vitesse de la molette
            smoothTouch: false, // Désactiver sur mobile pour de meilleures performances
            touchMultiplier: 2,
            infinite: false,
        })

        // Fonction d'animation
        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        // Cleanup
        return () => {
            document.documentElement.classList.remove('lenis')
            lenis.destroy()
        }
    }, [])

    return <>{children}</>
}

