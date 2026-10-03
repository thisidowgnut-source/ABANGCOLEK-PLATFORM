import { BRAND_ASSETS } from './brand-assets';

export default function BrandLogo({ className, loading = 'eager' }: { className?: string; loading?: 'eager' | 'lazy' }) {
  return <img className={className} src={BRAND_ASSETS.logo.src} alt={BRAND_ASSETS.logo.alt} width={BRAND_ASSETS.logo.width} height={BRAND_ASSETS.logo.height} loading={loading} />;
}
