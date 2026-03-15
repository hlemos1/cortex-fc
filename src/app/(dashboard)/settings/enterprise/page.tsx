"use client"

import { useState, useEffect } from "react"
import {
  Palette,
  Globe,
  Shield,
  Save,
  Check,
  Lock,
  Crown,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function EnterpriseSettingsPage() {
  // Branding state
  const [branding, setBranding] = useState({
    logoUrl: "",
    brandPrimaryColor: "#10b981",
    brandAccentColor: "#06b6d4",
    brandDarkBg: "#09090b",
    customDomain: "",
    faviconUrl: "",
  })

  // SSO state
  const [sso, setSso] = useState({
    ssoProvider: "",
    ssoEntityId: "",
    ssoLoginUrl: "",
    ssoCertificate: "",
    ssoEnabled: false,
  })

  const [saving, setSaving] = useState<"branding" | "sso" | null>(null)
  const [saved, setSaved] = useState<"branding" | "sso" | null>(null)
  const [tierLocked, setTierLocked] = useState(false)

  useEffect(() => {
    // Fetch branding
    fetch("/api/org/branding")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setBranding((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(json.data).filter(([, v]) => v !== null)
            ),
          }))
        }
      })
      .catch(() => {})

    // Fetch SSO
    fetch("/api/org/sso")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setSso((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(json.data).filter(([, v]) => v !== null)
            ),
          }))
        }
        if (json.error?.includes("403")) setTierLocked(true)
      })
      .catch(() => {})
  }, [])

  async function saveBranding() {
    setSaving("branding")
    try {
      const res = await fetch("/api/org/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      })
      if (res.ok) {
        setSaved("branding")
        setTimeout(() => setSaved(null), 2000)
      }
    } finally {
      setSaving(null)
    }
  }

  async function saveSso() {
    setSaving("sso")
    try {
      const res = await fetch("/api/org/sso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sso),
      })
      if (res.ok) {
        setSaved("sso")
        setTimeout(() => setSaved(null), 2000)
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Enterprise
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          White-label, SSO e configuracoes avancadas
        </p>
      </div>

      {tierLocked && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Recursos Enterprise</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              White-label e SSO requerem o plano Holding Multi-Club.
            </p>
          </div>
          <Button size="sm" className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-xs">
            Upgrade
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* White-Label / Branding */}
        <Card className="glass rounded-xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                </div>
                White-Label
              </CardTitle>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                ENTERPRISE
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">
              Personalize cores, logo e dominio
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Logo URL</Label>
              <Input
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">Cor Primaria</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.brandPrimaryColor}
                    onChange={(e) => setBranding({ ...branding, brandPrimaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <Input
                    value={branding.brandPrimaryColor}
                    onChange={(e) => setBranding({ ...branding, brandPrimaryColor: e.target.value })}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">Cor Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.brandAccentColor}
                    onChange={(e) => setBranding({ ...branding, brandAccentColor: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <Input
                    value={branding.brandAccentColor}
                    onChange={(e) => setBranding({ ...branding, brandAccentColor: e.target.value })}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.brandDarkBg}
                    onChange={(e) => setBranding({ ...branding, brandDarkBg: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <Input
                    value={branding.brandDarkBg}
                    onChange={(e) => setBranding({ ...branding, brandDarkBg: e.target.value })}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-zinc-700/40 p-4 space-y-2">
              <p className="text-[10px] text-zinc-600 uppercase font-medium">Preview</p>
              <div
                className="rounded-lg p-4 flex items-center gap-3"
                style={{ backgroundColor: branding.brandDarkBg }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: branding.brandPrimaryColor + "33" }}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: branding.brandPrimaryColor }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: branding.brandPrimaryColor }}>
                    Seu Clube FC
                  </p>
                  <p className="text-[10px]" style={{ color: branding.brandAccentColor }}>
                    NEURAL ANALYTICS
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-800/50" />

            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Dominio Customizado
              </Label>
              <Input
                value={branding.customDomain}
                onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                placeholder="analytics.seuclube.com"
                className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono rounded-lg"
              />
              <p className="text-[10px] text-zinc-600">
                Configure o CNAME do seu dominio para cortex-fc.vercel.app
              </p>
            </div>

            <Button
              onClick={saveBranding}
              disabled={saving === "branding"}
              className={`w-full transition-all ${
                saved === "branding"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {saved === "branding" ? (
                <><Check className="w-4 h-4 mr-2" /> Salvo!</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Salvar Branding</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* SSO / SAML */}
        <Card className="glass rounded-xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                </div>
                SSO / SAML
              </CardTitle>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                ENTERPRISE
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">
              Single Sign-On para login corporativo
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Provedor</Label>
              <select
                value={sso.ssoProvider}
                onChange={(e) => setSso({ ...sso, ssoProvider: e.target.value })}
                className="w-full h-9 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 text-sm text-zinc-300 outline-none focus:border-emerald-500/50"
              >
                <option value="">Nenhum</option>
                <option value="saml">SAML 2.0</option>
                <option value="oidc">OpenID Connect</option>
              </select>
            </div>

            {sso.ssoProvider && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">Entity ID / Issuer</Label>
                  <Input
                    value={sso.ssoEntityId}
                    onChange={(e) => setSso({ ...sso, ssoEntityId: e.target.value })}
                    placeholder="https://idp.seuclube.com/saml/metadata"
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">Login URL</Label>
                  <Input
                    value={sso.ssoLoginUrl}
                    onChange={(e) => setSso({ ...sso, ssoLoginUrl: e.target.value })}
                    placeholder="https://idp.seuclube.com/saml/sso"
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                    Certificado X.509 (PEM)
                  </Label>
                  <textarea
                    value={sso.ssoCertificate}
                    onChange={(e) => setSso({ ...sso, ssoCertificate: e.target.value })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={4}
                    className="w-full rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-300 font-mono outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                <Separator className="bg-zinc-800/50" />

                {/* SSO Info */}
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-3 space-y-2">
                  <p className="text-[10px] text-zinc-600 uppercase font-medium">Informacoes do SP</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ACS URL:</span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        https://cortex-fc.vercel.app/api/auth/callback/saml
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Entity ID:</span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        https://cortex-fc.vercel.app
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50">
                  <div>
                    <p className="text-sm text-zinc-300">Ativar SSO</p>
                    <p className="text-[11px] text-zinc-600">Usuarios poderao fazer login via IdP</p>
                  </div>
                  <button
                    onClick={() => setSso({ ...sso, ssoEnabled: !sso.ssoEnabled })}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                      sso.ssoEnabled ? "bg-emerald-500" : "bg-zinc-700/80"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        sso.ssoEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            <Button
              onClick={saveSso}
              disabled={saving === "sso" || !sso.ssoProvider}
              className={`w-full transition-all ${
                saved === "sso"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {saved === "sso" ? (
                <><Check className="w-4 h-4 mr-2" /> Salvo!</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Salvar SSO</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
