export const COLORS = {
	red: {
		title: 'Red',
		user_selectable: true,
		base: {
			hsl: '0, 84%, 60%'
		},
		light_variant_with_border: {
			class: 'border border-red-500 bg-red-50 dark:border-red-900/90 dark:bg-red-950/30'
		},
		light_variant: {
			class:
				'dark:bg-red-500/15 dark:text-red-400 bg-red-600/15 text-red-500 border-none shadow-none'
		}
	},
	blue: {
		title: 'Blue',
		user_selectable: true,
		base: {
			hsl: '217, 91%, 60%'
		},
		light_variant_with_border: {
			class: 'border border-blue-500 bg-blue-50 dark:border-blue-900/90 dark:bg-blue-950/30'
		},
		light_variant: {
			class:
				'dark:bg-blue-500/15 dark:text-blue-400 bg-blue-600/15 text-blue-500 border-none shadow-none'
		}
	},
	teal: {
		title: 'Teal',
		user_selectable: true,
		base: {
			hsl: '173, 80%, 40%'
		},
		light_variant_with_border: {
			class: 'border border-teal-500 bg-teal-50 dark:border-teal-900/90 dark:bg-teal-950/30'
		},
		light_variant: {
			class:
				'dark:bg-teal-500/15 dark:text-teal-400 bg-teal-600/15 text-teal-500 border-none shadow-none'
		}
	},
	yellow: {
		title: 'Yellow',
		user_selectable: false,
		base: {
			hsl: '42, 100%, 60%'
		},
		light_variant_with_border: {
			class: 'border border-yellow-500 bg-yellow-50 dark:border-yellow-900/90 dark:bg-yellow-950/30'
		},
		light_variant: {
			class:
				'dark:bg-yellow-500/15 dark:text-yellow-400 bg-yellow-600/15 text-yellow-500 border-none shadow-none'
		}
	},
	amber: {
		title: 'Amber',
		user_selectable: true,
		base: {
			hsl: '42, 100%, 60%'
		},
		light_variant_with_border: {
			class: 'border border-amber-500 bg-amber-50 dark:border-amber-900/90 dark:bg-amber-950/30'
		},
		light_variant: {
			class:
				'dark:bg-amber-500/15 dark:text-amber-400 bg-amber-600/15 text-amber-500 border-none shadow-none'
		}
	},
	purple: {
		title: 'Purple',
		user_selectable: true,
		base: {
			hsl: '262, 83%, 58%'
		},
		light_variant_with_border: {
			class: 'border border-purple-500 bg-purple-50 dark:border-purple-900/90 dark:bg-purple-950/30'
		},
		light_variant: {
			class:
				'dark:bg-purple-500/15 dark:text-purple-400 bg-purple-600/15 text-purple-500 border-none shadow-none'
		}
	},
	pink: {
		title: 'Pink',
		user_selectable: true,
		base: {
			hsl: '340, 84%, 67%'
		},
		light_variant_with_border: {
			class: 'border border-pink-500 bg-pink-50 dark:border-pink-900/90 dark:bg-pink-950/30'
		},
		light_variant: {
			class:
				'dark:bg-pink-500/15 dark:text-pink-400 bg-pink-600/15 text-pink-500 border-none shadow-none'
		}
	},
	orange: {
		title: 'Orange',
		user_selectable: true,
		base: {
			hsl: '24, 94%, 56%'
		},
		light_variant_with_border: {
			class: 'border border-orange-500 bg-orange-50 dark:border-orange-900/90 dark:bg-orange-950/30'
		},
		light_variant: {
			class:
				'dark:bg-orange-500/15 dark:text-orange-400 bg-orange-600/15 text-orange-500 border-none shadow-none'
		}
	},
	indigo: {
		title: 'Indigo',
		user_selectable: true,
		base: {
			hsl: '234, 89%, 64%'
		},
		light_variant_with_border: {
			class: 'border border-indigo-500 bg-indigo-50 dark:border-indigo-900/90 dark:bg-indigo-950/30'
		},
		light_variant: {
			class:
				'dark:bg-indigo-500/15 dark:text-indigo-400 bg-indigo-600/15 text-indigo-500 border-none shadow-none'
		}
	},
	slate: {
		title: 'Slate',
		user_selectable: false,
		base: { hsl: '–, –, –' }, // replace with actual HSL
		light_variant_with_border: {
			class: 'border border-slate-500 bg-slate-50 dark:border-slate-900/90 dark:bg-slate-950/30'
		},
		light_variant: {
			class:
				'dark:bg-slate-500/15 dark:text-slate-400 bg-slate-600/15 text-slate-500 border-none shadow-none'
		}
	},

	gray: {
		title: 'Gray',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-gray-500 bg-gray-50 dark:border-gray-900/90 dark:bg-gray-950/30'
		},
		light_variant: {
			class:
				'dark:bg-gray-500/15 dark:text-gray-400 bg-gray-600/15 text-gray-500 border-none shadow-none'
		}
	},

	zinc: {
		title: 'Zinc',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-zinc-500 bg-zinc-50 dark:border-zinc-900/90 dark:bg-zinc-950/30'
		},
		light_variant: {
			class:
				'dark:bg-zinc-500/15 dark:text-zinc-400 bg-zinc-600/15 text-zinc-500 border-none shadow-none'
		}
	},

	neutral: {
		title: 'Neutral',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class:
				'border border-neutral-500 bg-neutral-50 dark:border-neutral-900/90 dark:bg-neutral-950/30'
		},
		light_variant: {
			class:
				'dark:bg-neutral-500/15 dark:text-neutral-400 bg-neutral-600/15 text-neutral-500 border-none shadow-none'
		}
	},

	stone: {
		title: 'Stone',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-stone-500 bg-stone-50 dark:border-stone-900/90 dark:bg-stone-950/30'
		},
		light_variant: {
			class:
				'dark:bg-stone-500/15 dark:text-stone-400 bg-stone-600/15 text-stone-500 border-none shadow-none'
		}
	},

	lime: {
		title: 'Lime',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-lime-500 bg-lime-50 dark:border-lime-900/90 dark:bg-lime-950/30'
		},
		light_variant: {
			class:
				'dark:bg-lime-500/15 dark:text-lime-400 bg-lime-600/15 text-lime-500 border-none shadow-none'
		}
	},

	green: {
		title: 'Green',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-green-500 bg-green-50 dark:border-green-900/90 dark:bg-green-950/30'
		},
		light_variant: {
			class:
				'dark:bg-green-500/15 dark:text-green-400 bg-green-600/15 text-green-500 border-none shadow-none'
		}
	},

	emerald: {
		title: 'Emerald',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class:
				'border border-emerald-500 bg-emerald-50 dark:border-emerald-900/90 dark:bg-emerald-950/30'
		},
		light_variant: {
			class:
				'dark:bg-emerald-500/15 dark:text-emerald-400 bg-emerald-600/15 text-emerald-500 border-none shadow-none'
		}
	},

	cyan: {
		title: 'Cyan',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-cyan-500 bg-cyan-50 dark:border-cyan-900/90 dark:bg-cyan-950/30'
		},
		light_variant: {
			class:
				'dark:bg-cyan-500/15 dark:text-cyan-400 bg-cyan-600/15 text-cyan-500 border-none shadow-none'
		}
	},

	sky: {
		title: 'Sky',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-sky-500 bg-sky-50 dark:border-sky-900/90 dark:bg-sky-950/30'
		},
		light_variant: {
			class:
				'dark:bg-sky-500/15 dark:text-sky-400 bg-sky-600/15 text-sky-500 border-none shadow-none'
		}
	},

	violet: {
		title: 'Violet',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-violet-500 bg-violet-50 dark:border-violet-900/90 dark:bg-violet-950/30'
		},
		light_variant: {
			class:
				'dark:bg-violet-500/15 dark:text-violet-400 bg-violet-600/15 text-violet-500 border-none shadow-none'
		}
	},

	fuchsia: {
		title: 'Fuchsia',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class:
				'border border-fuchsia-500 bg-fuchsia-50 dark:border-fuchsia-900/90 dark:bg-fuchsia-950/30'
		},
		light_variant: {
			class:
				'dark:bg-fuchsia-500/15 dark:text-fuchsia-400 bg-fuchsia-600/15 text-fuchsia-500 border-none shadow-none'
		}
	},

	rose: {
		title: 'Rose',
		user_selectable: false,
		base: { hsl: '–, –, –' },
		light_variant_with_border: {
			class: 'border border-rose-500 bg-rose-50 dark:border-rose-900/90 dark:bg-rose-950/30'
		},
		light_variant: {
			class:
				'dark:bg-rose-500/15 dark:text-rose-400 bg-rose-600/15 text-rose-500 border-none shadow-none'
		}
	},
	primary: {
		title: 'primary',
		user_selectable: false,
		base: {
			hsl: '234, 89%, 64%'
		},
		light_variant_with_border: {
			class: 'border border-indigo-500 bg-indigo-50 dark:border-indigo-900/90 dark:bg-indigo-950/30'
		},
		light_variant: {
			class:
				'dark:bg-indigo-500/15 dark:text-indigo-400 bg-indigo-600/15 text-indigo-500 border-none shadow-none'
		}
	}
} as const satisfies Record<
	string,
	{
		title: string;
		user_selectable: boolean;
		base: { hsl: string };
		light_variant_with_border: { class: string };
		light_variant: { class: string };
	}
>;

export type color_name = keyof typeof COLORS;
