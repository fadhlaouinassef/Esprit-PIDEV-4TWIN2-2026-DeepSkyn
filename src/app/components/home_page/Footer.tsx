"use client"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

type FooterLink = {
  label: string
  href: string
}

type FooterSection = {
  title: string
  links: FooterLink[]
}

type FooterProps = {
  companyName?: string
  tagline?: string
  sections?: FooterSection[]
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    email?: string
  }
  copyrightText?: string
}

function getDefaultSections(t: ReturnType<typeof useTranslations>): FooterSection[] {
  return [
    {
      title: t('home.footer.sections.products.title'),
      links: [
        { label: t('home.footer.sections.products.cleansers'), href: "#products" },
        { label: t('home.footer.sections.products.moisturizers'), href: "#products" },
        { label: t('home.footer.sections.products.serums'), href: "#products" },
        { label: t('home.footer.sections.products.masks'), href: "#products" },
        { label: t('home.footer.sections.products.giftSets'), href: "#products" },
      ],
    },
    {
      title: t('home.footer.sections.company.title'),
      links: [
        { label: t('home.footer.sections.company.about'), href: "#about" },
        { label: t('home.footer.sections.company.careers'), href: "#careers" },
        { label: t('home.footer.sections.company.beautyBlog'), href: "#blog" },
        { label: t('home.footer.sections.company.press'), href: "#press" },
        { label: t('home.footer.sections.company.contact'), href: "#contact" },
      ],
    },
    {
      title: t('home.footer.sections.resources.title'),
      links: [
        { label: t('home.footer.sections.resources.skincareGuide'), href: "#routine" },
        { label: t('home.footer.sections.resources.helpCenter'), href: "#help" },
        { label: t('home.footer.sections.resources.community'), href: "#community" },
        { label: t('home.footer.sections.resources.testimonials'), href: "#testimonials" },
        { label: t('home.footer.sections.resources.tutorials'), href: "#tutorials" },
      ],
    },
    {
      title: t('home.footer.sections.legal.title'),
      links: [
        { label: t('home.footer.sections.legal.privacyPolicy'), href: "#privacy" },
        { label: t('home.footer.sections.legal.termsOfService'), href: "#terms" },
        { label: t('home.footer.sections.legal.shipping'), href: "#shipping" },
        { label: t('home.footer.sections.legal.returns'), href: "#returns" },
        { label: t('home.footer.sections.legal.cookies'), href: "#cookies" },
      ],
    },
  ]
}

export const Footer = ({
  companyName = "DeepSkyn",
  tagline,
  sections,
  socialLinks = {
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    email: "contact@deepskyn.com",
  },
  copyrightText,
}: FooterProps) => {
  const t = useTranslations()
  const currentYear = new Date().getFullYear()
  const resolvedTagline = tagline ?? t('home.footer.tagline')
  const resolvedSections = sections ?? getDefaultSections(t)
  const copyright =
    copyrightText ?? t('home.footer.copyright', { year: currentYear, company: companyName })
  return (
    <footer className="w-full bg-[#fafafa] border-t border-[#e5e5e5]">
      <div className="max-w-[1200px] mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="col-span-2"
          >
            <div className="mb-4">
              <h3
                className="text-2xl font-semibold text-[#202020] mb-2"
                style={{ fontFamily: "Satoshi", fontWeight: "500" }}
              >
                {companyName}
              </h3>
              <p className="text-sm leading-5 text-[#666666] max-w-xs" style={{ fontFamily: "Satoshi" }}>
                {resolvedTagline}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {socialLinks.email && (
                <a
                  href={`mailto:${socialLinks.email}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e5e5e5] text-[#666666] hover:text-[#202020] hover:border-[#202020] transition-colors duration-150"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </motion.div>

          {/* Link Sections */}
          {resolvedSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="col-span-1"
            >
              <h4
                className="text-sm font-medium text-[#202020] mb-4 uppercase tracking-wide"
                style={{ fontFamily: "Satoshi", fontWeight: "500" }}
              >
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                      style={{ fontFamily: "Satoshi" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pt-8 border-t border-[#e5e5e5]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#666666]" style={{ fontFamily: "Satoshi" }}>
              {copyright}
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#status"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                style={{ fontFamily: "Satoshi" }}
              >
                {t('home.footer.status')}
              </a>
              <a
                href="#sitemap"
                className="text-sm text-[#666666] hover:text-[#202020] transition-colors duration-150"
                style={{ fontFamily: "Satoshi" }}
              >
                {t('home.footer.sitemap')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}


