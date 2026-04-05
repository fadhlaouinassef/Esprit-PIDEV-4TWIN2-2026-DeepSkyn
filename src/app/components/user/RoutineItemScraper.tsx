"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ExternalLink, ShoppingBag, ShoppingCart, AlertTriangle } from "lucide-react";

interface Product {
  title: string;
  url: string;
  price: string;
  imageUrl: string;
  merchantName: string;
  description: string;
}

interface RoutineItemScraperProps {
  action: string;
  enabled?: boolean;
}

/** Fetches the OG image from a product URL using the existing og-image API */
function ProductImage({ url, title, imageUrl }: { url: string; title: string; imageUrl: string }) {
  const [finalImage, setFinalImage] = useState<string | null>(imageUrl || null);
  const [loadingImg, setLoadingImg] = useState(!imageUrl && !!url);

  useEffect(() => {
    if (imageUrl || !url) return;
    let cancelled = false;
    setLoadingImg(true);
    fetch(`/api/scraping/og-image?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.imageUrl) setFinalImage(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingImg(false); });
    return () => { cancelled = true; };
  }, [url, imageUrl]);

  if (loadingImg) {
    return (
      <div className="size-full flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (finalImage) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={finalImage}
        alt={title}
        className="size-full object-contain p-2 transition-transform group-hover:scale-110"
      />
    );
  }

  return (
    <div className="size-full flex items-center justify-center text-gray-300">
      <ShoppingBag className="size-8" />
    </div>
  );
}

export function RoutineItemScraper({ action, enabled = true }: RoutineItemScraperProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchProducts() {
      const cleanAction = action.split(':')[0].trim();
      const cacheKey = `product_${cleanAction.toLowerCase().replace(/\s+/g, '_')}`;

      // Load from local cache (valid 2h)
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 1000 * 60 * 60 * 2) {
            console.log(`💾 Cache hit for ${cleanAction}`);
            setProducts(data);
            return;
          }
        } catch (e) {}
      }

      // Stagger delay to avoid hitting Apify memory limit (8GB on free plan)
      const staggerDelay = 2000 + Math.random() * 25000;
      await new Promise(r => setTimeout(r, staggerDelay));

      setLoading(true);
      setError(null);
      try {
        console.log(`🔍 Scraping started for: ${cleanAction}`);
        const res = await fetch("/api/scraping/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: cleanAction,
            isTunisia: true,
            maxResults: 3
          }),
        });

        const data = await res.json();
        console.log(`📦 Scraping result for ${cleanAction}:`, data);

        if (!res.ok) throw new Error(data.error || `Scraping failed (${res.status})`);

        if (!cancelled) {
          const results = data.results || [];
          setProducts(results);
          localStorage.setItem(cacheKey, JSON.stringify({ data: results, timestamp: Date.now() }));
        }
      } catch (err: any) {
        console.error(`❌ Scraping error for ${cleanAction}:`, err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [action, enabled]);

  if (!enabled) {
    return null;
  }

  const handleRetry = () => {
    const cleanAction = action.split(':')[0].trim();
    localStorage.removeItem(`product_${cleanAction.toLowerCase().replace(/\s+/g, '_')}`);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
        <Loader2 className="size-4 text-primary animate-spin" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Searching La Roche-Posay on primini.tn...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 flex items-center gap-2">
          <AlertTriangle className="size-3 text-amber-500" />
          <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tight">
            {error.includes("memory") ? "Memory limit exceeded." :
             error.includes("402") ? "Apify Credit Limit Reached" : "Recommendation Unavailable"}
          </span>
        </div>
        <button onClick={handleRetry} className="text-[9px] font-black text-primary uppercase text-left hover:underline px-4">
          Réessayer
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-3 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200/50 flex items-center gap-2">
        <ShoppingBag className="size-3 text-gray-400" />
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
            No La Roche-Posay {action.split(':')[0]} found on primini.tn
          </span>
          <button onClick={handleRetry} className="text-[8px] font-black text-primary uppercase text-left hover:underline py-1">
            Relancer la recherche
          </button>
        </div>
      </div>
    );
  }

  const product = products[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-primary/10 shadow-lg shadow-primary/5 group"
    >
      <div className="flex gap-4">
        {/* Product Image — fetches OG image from the product page if Google didn't return one */}
        <div className="relative size-20 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <ProductImage url={product.url} title={product.title} imageUrl={product.imageUrl} />
          {product.price && product.price !== 'N/A' && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-lg bg-primary/90 text-[10px] font-black text-white backdrop-blur-sm">
              {product.price}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <ShoppingCart className="size-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest truncate">
              {product.merchantName || "primini.tn"}
            </span>
          </div>
          <h5 className="text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.title}
          </h5>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {product.description || "Produit La Roche-Posay disponible sur primini.tn."}
          </p>

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline group/link"
          >
            Voir sur primini.tn
            <ExternalLink className="size-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
