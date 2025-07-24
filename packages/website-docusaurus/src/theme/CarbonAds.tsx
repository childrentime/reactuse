// CarbonAds.tsx
import React, { useEffect, useRef, useState } from 'react';

interface CarbonAdsProps {
 serve?: string;
 placement?: string;
 format?: string;
}

// 立即检测移动设备，无延迟
const isMobileDevice = () => {
  return window.innerWidth <= 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function CarbonAds({ 
 serve = "CW7IL2JW", 
 placement = "wwwreactusecom", 
 format = "cover"
}: CarbonAdsProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const [isClient, setIsClient] = useState(false);
 const [isMobile, setIsMobile] = useState(false);
 
 // 检测是否在客户端，并检测移动设备
 useEffect(() => {
   setIsClient(true);
   setIsMobile(isMobileDevice());
 }, []);



 useEffect(() => {
   // 移动端不加载广告
   if (isMobile || !containerRef.current || !isClient) return;

   // 清理之前可能存在的广告
   const existingScript = document.getElementById('_carbonads_js');
   if (existingScript) {
     existingScript.remove();
   }
   
   const existingAds = document.getElementById('carbonads');
   if (existingAds) {
     existingAds.remove();
   }

   const script = document.createElement('script');
   script.src = `//cdn.carbonads.com/carbon.js?serve=${serve}&placement=${placement}&format=${format}`;
   script.async = true;
   script.id = '_carbonads_js';
   
   script.onload = () => {
     console.log('Carbon ads script loaded');
   };
   
   script.onerror = (error) => {
     console.error('Carbon ads script failed to load:', error);
   };
   
   containerRef.current.appendChild(script);

   return () => {
     // 清理脚本
     const scriptEl = document.getElementById('_carbonads_js');
     if (scriptEl) {
       scriptEl.remove();
     }
     // 清理广告容器
     const adsEl = document.getElementById('carbonads');
     if (adsEl) {
       adsEl.remove();
     }
   };
 }, [serve, placement, format, isMobile, isClient]);

 useEffect(() => {
  if(!isClient || isMobile) return;
   // 符合Carbon Ads政策的样式
   const style = document.createElement('style');
   style.textContent = `
     .carbon-ads-sidebar {
       position: fixed;
       top: 45%; /* 确保在初始视口内可见 (1366x768) */
       right: 20px;
       width: 160px;
       z-index: 999;
     }
     
     /* 桌面端优化 - 确保在大屏幕上可见 */
     @media (min-width: 1366px) {
       .carbon-ads-sidebar {
         top: 30%; /* 在大屏幕上稍微居中一些 */
       }
     }
     
     /* 移动端完全隐藏 */
     @media (max-width: 768px) {
       .carbon-ads-sidebar {
         display: none !important;
       }
     }
   `;
   
   document.head.appendChild(style);
   
   return () => {
     if (document.head.contains(style)) {
       document.head.removeChild(style);
     }
   };
 }, [isClient, isMobile]);

  // 服务端返回 null
  if (!isClient) {
    return null;
  }

 // 移动端不渲染任何内容
 if (isMobile) {
   return null;
 }

 return (
   <div 
     ref={containerRef} 
     className="carbon-ads-sidebar"
   />
 );
}