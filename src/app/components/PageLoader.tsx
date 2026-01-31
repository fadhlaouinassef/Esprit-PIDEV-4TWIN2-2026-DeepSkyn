'use client';

import { motion } from 'framer-motion';

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="container mx-auto px-4 py-8 h-full">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-20 bg-muted rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 h-16 w-3/4 bg-muted rounded-lg animate-pulse" />
          <div 
            className="mx-auto mb-4 h-12 w-2/3 bg-muted rounded-lg animate-pulse"
            style={{ animationDelay: '100ms' }}
          />
          <div 
            className="mx-auto mb-8 h-6 w-1/2 bg-muted rounded-lg animate-pulse"
            style={{ animationDelay: '200ms' }}
          />
          <div className="flex justify-center gap-4">
            <div 
              className="h-12 w-32 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
            <div 
              className="h-12 w-32 bg-muted rounded-lg animate-pulse"
              style={{ animationDelay: '400ms' }}
            />
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="bg-card rounded-xl p-6 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-4 h-40 w-full bg-muted rounded-lg animate-pulse" />
              <div 
                className="mb-2 h-6 w-3/4 bg-muted rounded animate-pulse"
                style={{ animationDelay: '100ms' }}
              />
              <div 
                className="mb-2 h-4 w-full bg-muted rounded animate-pulse"
                style={{ animationDelay: '200ms' }}
              />
              <div 
                className="h-4 w-2/3 bg-muted rounded animate-pulse"
                style={{ animationDelay: '300ms' }}
              />
            </motion.div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3 shadow-lg">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-2">Chargement...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimplePageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative">
        <motion.div
          className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
}
