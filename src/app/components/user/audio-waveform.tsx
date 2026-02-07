"use client"

import { useEffect, useRef } from "react"

interface AudioWaveformProps {
    isRecording: boolean
    stream: MediaStream | null
}

export function AudioWaveform({ isRecording, stream }: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!isRecording || !stream || !canvasRef.current) return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 32
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")!

        let animationId: number

        const draw = () => {
            animationId = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height
                ctx.fillStyle = "rgb(239, 68, 68)" // red-500
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
                x += barWidth + 1
            }
        }

        draw()

        return () => {
            cancelAnimationFrame(animationId)
            audioContext.close()
        }
    }, [isRecording, stream])

    return (
        <canvas
            ref={canvasRef}
            width={100}
            height={20}
            className="w-full h-8 opacity-50"
        />
    )
}
