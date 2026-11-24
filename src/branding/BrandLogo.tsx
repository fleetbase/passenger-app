import React from 'react';
import { Image } from 'react-native';
import { logo as builtLogo, logoDark as builtLogoDark } from '../generated/brand-assets';
import { hostedPreview } from '../preview/host';
import { useApp } from '../state/AppContext';
import { T } from '../ui';
import { branding } from '.';

const logo = hostedPreview?.logo ? { uri: hostedPreview.logo } : builtLogo;
const logoDark = hostedPreview?.logoDark ? { uri: hostedPreview.logoDark } : hostedPreview?.logo ? null : builtLogoDark;

/** The operator's logo from brand/logo.png (or a hosted preview's), or their name when they don't have one. */
export function BrandLogo({ height = 32, fallback = true }: { height?: number; fallback?: boolean }) {
    const { scheme } = useApp();
    const source = scheme === 'dark' ? (logoDark ?? logo) : logo;
    if (!source) {
        return fallback ? (
            <T variant="strong" fontWeight="700">
                {branding.name}
            </T>
        ) : null;
    }
    return <Image accessibilityLabel={branding.name} source={source} resizeMode="contain" style={{ height, width: height * 4 }} />;
}
