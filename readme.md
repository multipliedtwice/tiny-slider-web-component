# Tiny Slider Web Component

Tiny Slider Web Component is a lightweight, responsive slider built as a web component. It's easy to integrate and flexible to use in any frontend framework.

## Features

- Lightweight (2.1kb) [Check on Bundlephobia](bundlephobia.com)
- SSR-compatible
- Framework agnostic
- Zero dependencies
- Zero influence on Google Lighthouse score
- Fully customizable via CSS
- Responsive and mobile-friendly

## Installation

To install the slider, you can use npm:

```bash
npm install tiny-slider-web-component
```

## Usage

Here's how you can use the slider in your HTML. The example from Svelte, but will work same way anywhere else.

```ts
<script lang="ts">
	import Image from "~components/cf-image/cf-image.svelte"
	import type { Root } from "./types"
	export let data: Root
</script>

<tiny-slider-web-component
	showDots
	class="relative flex max-w-[calc(100vw-4rem)] md:max-w-[calc(80vw-4rem)] overflow-hidden mx-auto">
	{#each data.homepage.slider as item, i}
		<div class="flex flex-col">
			<figure>
				<Image
					loading={i >= 1 ? "lazy" : "eager"}
					classes="rounded-3xl md:rounded-2xl  w-[clamp(100px,calc(100vw-4rem),768px)] md:w-[clamp(640px,calc(80vw-4rem),1900px)] aspect-[3/5] md:aspect-[1469/837] max-w-[unset] h-auto object-bottom object-cover"
					src={item.media.url}
					mobileSrc={item.media_mobile.url}
					alt={item.label} />
			</figure>
			<span class="pt-4 pb-0 px-6">
				<h2 class="text-2xl font-bold">{item.title}</h2>
				<p>{@html item.description}</p>
			</span>
		</div>
	{/each}
</tiny-slider-web-component>
```
