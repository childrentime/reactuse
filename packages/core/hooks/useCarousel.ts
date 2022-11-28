import { useState } from "react";
// 返回两个 containerProps(只需要计算translate的高度) 和 wrapperProps(ref获取高度)
// 冗余一倍元素实现轮播
// 在开头插入无用元素

import { useRef } from "react";

// 支持上下左右
export default function useCarousel() {
  const wrapperRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);

  const containerProps = {
    style: {
      transform: `translate3d(0px, -${
        index * (wrapperRef.current?.clientHeight || 0)
      }px, 0px)`,
    },
  };

  const wrapperProps = {
    ref: wrapperRef,
  };
  return {};
}
