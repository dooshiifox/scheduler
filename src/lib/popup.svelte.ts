import {
	arrow,
	autoUpdate,
	computePosition,
	flip,
	offset,
	shift,
	type Side
} from "@floating-ui/dom";
import { noop, unreachable } from "albtc";
import { tick } from "svelte";

/******************************************************************************
 *   DONT FORGET THE STYLES IN `app.css`!!!!!!
 ******************************************************************************/

/** Placement https://floating-ui.com/docs/computePosition#placement */
type Direction = "top" | "bottom" | "left" | "right";
type Placement = Direction | `${Direction}-start` | `${Direction}-end`;

// Options & Middleware
export type Middleware = {
	// Required ---
	/** Offset middleware settings: https://floating-ui.com/docs/offset */
	offset?: Parameters<typeof offset>[0];
	/** Shift middleware settings: https://floating-ui.com/docs/shift */
	shift?: Parameters<typeof shift>[0];
	/** Flip middleware settings: https://floating-ui.com/docs/flip */
	flip?: Parameters<typeof flip>[0];
	/** Arrow middleware settings: https://floating-ui.com/docs/arrow
	 *
	 *  **Prefer `use:popup.arrow` over this.**
	 */
	arrow?: { element: Element };
	// Optional ---
	// /** Size middleware settings: https://floating-ui.com/docs/size */
	// size?: Parameters<typeof size>[0];
	// /** Auto Placement middleware settings: https://floating-ui.com/docs/autoPlacement */
	// autoPlacement?: Parameters<typeof autoPlacement>[0];
	// /** Hide middleware settings: https://floating-ui.com/docs/hide */
	// hide?: Parameters<typeof hide>[0];
	// /** Inline middleware settings: https://floating-ui.com/docs/inline */
	// inline?: Parameters<typeof inline>[0];
};

export type PopupSettings = {
	/** Provide the event type.
	 *
	 *  - `click` - When the button is clicked it opens. When anything else
	 *    is clicked it closes.
	 *  - `hover` - When the button is hovered it opens. When it stops
	 *    being hovered it closes.
	 *  - `focus-blur` - When the button is focused it opens. When it
	 *    loses focus it closes.
	 *  - `focus-click` - When the button is focused it opens. When anything
	 *    else is clicked it closes.
	 *  - `custom` - Open & close behaviour is defined by the user.
	 */
	event: "click" | "hover" | "focus-blur" | "focus-click" | "custom";
	/** Set the placement position. Defaults 'bottom'. */
	placement?: Placement;
	/** Query elements that close the popup when clicked. Defaults `'a[href], button'`. */
	closeQuery?: string;
	/** Provide Floating UI middleware settings. */
	middleware?: Middleware;
};

const focusableAllowedList =
	':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

export function popup(args: PopupSettings) {
	// Whether the popup is open *at all*, including transitions.
	let isOpen = $state(false);
	// Whether the popup is open. If in closing animation, will be `false`.
	let currentlyOpen = $state(isOpen);
	let autoUpdateCleanup = noop;

	let focusablePopupElements: Array<HTMLElement>;

	let buttonEl: HTMLElement | undefined;
	let popupEl: HTMLElement | undefined;
	let arrowEl: HTMLElement | undefined;

	// Render Floating UI Popup
	function render(): void {
		if (!buttonEl) throw new Error("Missing button element.");
		if (!popupEl) throw new Error("Missing popup element.");

		void computePosition(buttonEl, popupEl, {
			placement: args.placement ?? "bottom",
			// Middleware - NOTE: the order matters:
			// https://floating-ui.com/docs/middleware#ordering
			middleware: [
				offset(args.middleware?.offset ?? 8),
				shift(args.middleware?.shift ?? { padding: 8 }),
				flip(args.middleware?.flip),
				...(arrowEl ? [arrow(args.middleware?.arrow ?? { element: arrowEl })] : [])
				// Following are optional
				// size(args.middleware?.size),
				// autoPlacement(args.middleware?.autoPlacement),
				// hide(args.middleware?.hide),
				// inline(args.middleware?.inline)
			]
		}).then(({ x, y, placement, middlewareData }) => {
			if (!popupEl) return;

			console.log(x, y);

			popupEl.style.left = `${x}px`;
			popupEl.style.top = `${y}px`;

			// Handle Arrow Placement:
			const { x: arrowX, y: arrowY } = middlewareData.arrow!;
			const staticSide = {
				top: "bottom",
				right: "left",
				bottom: "top",
				left: "right"
			}[placement.split("-")[0]! as Side];

			if (arrowEl) {
				Object.assign(arrowEl.style, {
					left: arrowX != null ? `${arrowX}px` : "",
					top: arrowY != null ? `${arrowY}px` : "",
					right: "",
					bottom: "",
					[staticSide]: "-4px"
				});
			}
		});
	}

	// State Handlers
	let openCount = 0;
	function open(): void {
		openCount++;
		if (!buttonEl) throw new Error("Missing button element.");
		if (!popupEl) throw new Error("Missing popup element.");

		// Set open state to on
		isOpen = true;
		currentlyOpen = true;

		// Update render settings
		render();

		// Update the DOM
		popupEl.style.display = "block";
		popupEl.style.pointerEvents = "auto";
		popupEl.setAttribute("data-popup-open", "true");

		// enable popup interactions
		popupEl.removeAttribute("inert");

		// Trigger Floating UI autoUpdate (open only)
		// https://floating-ui.com/docs/autoUpdate
		autoUpdateCleanup = autoUpdate(buttonEl, popupEl, render);
		// Focus the first focusable element within the popup
		focusablePopupElements = Array.from(popupEl.querySelectorAll(focusableAllowedList));
	}

	function close(callback?: () => void, duration?: number): void {
		if (!popupEl) throw new Error("Missing popup element.");

		const prevTransitionDuration = popupEl.style.transitionDuration;
		// Set transition duration
		if (duration === undefined) {
			duration =
				parseFloat(window.getComputedStyle(popupEl).transitionDuration.replace("s", "")) * 1000;
		} else {
			popupEl.style.transitionDuration = `${duration}ms`;
		}

		popupEl.removeAttribute("data-popup-open");
		currentlyOpen = false;

		setTimeout(() => {
			requestAnimationFrame(() => {
				if (!popupEl) return;
				if (duration !== undefined) {
					// Reset transition duration
					popupEl.style.transitionDuration = prevTransitionDuration;
				}

				popupEl.style.display = "none";
				// Set open state to off
				isOpen = false;
				// disable popup interactions
				popupEl.setAttribute("inert", "");
				// Cleanup Floating UI autoUpdate (close only)
				autoUpdateCleanup?.();
				// Trigger callback
				callback?.();
			});
		}, duration);
	}

	// Event Handlers
	function toggle(): void {
		if (isOpen === false) {
			open();
		} else {
			close();
		}
	}

	function button(buttonNode: HTMLElement) {
		buttonEl = buttonNode;

		function onWindowClick(event: MouseEvent): void {
			// Return if the popup is not yet open
			if (isOpen === false) return;

			const target = event.target as Node | null;
			// Return if click is the trigger element
			if (buttonNode.contains(target)) return;
		}

		// Keyboard Interactions for A11y
		function onWindowKeyDown(event: KeyboardEvent): void {
			if (isOpen === false) return;
			// Handle keys
			const key: string = event.key;
			// On Esc key
			if (key === "Escape") {
				event.preventDefault();
				buttonNode.focus();
				close();
				return;
			}
			// On Tab or ArrowDown key
			const triggerMenuFocused: boolean = isOpen && document.activeElement === buttonNode;
			if (
				triggerMenuFocused &&
				(key === "ArrowDown" || key === "Tab") &&
				focusableAllowedList.length > 0 &&
				focusablePopupElements.length > 0
			) {
				event.preventDefault();
				focusablePopupElements[0]!.focus();
			}
		}

		// Event Listeners
		switch (args.event) {
			case "click":
				buttonNode.addEventListener("click", toggle, true);
				window.addEventListener("click", onWindowClick, true);
				break;
			case "hover":
				buttonNode.addEventListener("mouseover", open, true);
				buttonNode.addEventListener("mouseleave", () => close(), true);
				break;
			case "focus-blur":
				buttonNode.addEventListener("focus", toggle, true);
				buttonNode.addEventListener("blur", () => close(), true);
				break;
			case "focus-click":
				buttonNode.addEventListener("focus", open, true);
				window.addEventListener("click", onWindowClick, true);
				break;
			case "custom":
				break;
			default: {
				unreachable(args.event);
			}
		}
		window.addEventListener("keydown", onWindowKeyDown, true);

		// Render popup on initialization
		// Await a svelte tick so if its declared with the button then popup,
		// it doesn't error due to the popup element being undefined.
		// (i.e.,)
		// <button use:popup.button>
		//   ...
		// </button>
		// <div use:popup.popup>
		//   ...
		// </div
		void tick().then(() => {
			render();
			if (isOpen) open();
			else close();
		});

		// Lifecycle
		return {
			update() {
				close(() => {
					render();
				});
			},
			destroy() {
				if (buttonEl === buttonNode) buttonEl = undefined;
				// Trigger Events
				buttonNode.removeEventListener("click", toggle, true);
				buttonNode.removeEventListener("mouseover", open, true);
				buttonNode.removeEventListener("mouseleave", () => close(), true);
				buttonNode.removeEventListener("focus", toggle, true);
				buttonNode.removeEventListener("focus", open, true);
				buttonNode.removeEventListener("blur", () => close(), true);
				// Window Events
				window.removeEventListener("click", onWindowClick, true);
				window.removeEventListener("keydown", onWindowKeyDown, true);
			}
		};
	}

	function popupAction(popupNode: HTMLElement) {
		popupEl = popupNode;

		const cleanup = $effect.root(() => {
			$effect(() => {
				popupNode.setAttribute("data-popup", currentlyOpen.toString());
			});

			return () => {
				popupNode.removeAttribute("data-popup");
			};
		});

		return {
			destroy() {
				if (popupEl === popupNode) popupEl = undefined;
				cleanup();
			}
		};
	}
	function arrowAction(arrowNode: HTMLElement) {
		arrowEl = arrowNode;

		const cleanup = $effect.root(() => {
			$effect(() => {
				arrowNode.setAttribute("data-popup-arrow", currentlyOpen.toString());
			});

			return () => {
				arrowNode.removeAttribute("data-popup-arrow");
			};
		});

		return {
			destroy() {
				if (arrowEl === arrowNode) {
					arrowEl = document.createElement("div");
				}
				cleanup();
			}
		};
	}

	async function trigger(duration = 5000) {
		if (currentlyOpen) {
			await new Promise<void>((res) => close(res, 0));
		}

		open();
		const currentOpenCount = openCount;
		await new Promise<void>((res) => setTimeout(res, duration));

		if (openCount !== currentOpenCount) return;
		close();
	}

	return {
		button,
		popup: popupAction,
		arrow: arrowAction,
		get isOpen() {
			return isOpen;
		},
		open,
		close,
		trigger
	};
}
