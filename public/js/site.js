/* ==========================================================================
   BodaLink site script. Plain JavaScript, no libraries. Loaded on every page.
   Every feature checks that its elements exist, so it is safe on any page.
   ========================================================================== */
(function () {
    "use strict";

    var doc = document;
    var root = doc.documentElement;

    /* ---------- Small helpers ---------- */

    function $(selector, context) {
        return (context || doc).querySelector(selector);
    }

    function $$(selector, context) {
        return Array.prototype.slice.call((context || doc).querySelectorAll(selector));
    }

    var store = {
        get: function (key) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        },
        set: function (key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                /* private mode or storage disabled: carry on without saving */
            }
        },
    };

    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function isEditable(el) {
        if (!el) return false;
        var tag = el.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /* A tiny polite announcer for screen readers + a visible toast. */
    var toastTimer = null;
    function toast(message) {
        var region = $("#toastRegion");
        if (!region) return;
        region.textContent = "";
        var el = doc.createElement("div");
        el.className = "toast";
        el.textContent = message;
        region.appendChild(el);
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            region.textContent = "";
        }, 2200);
    }

    /* ---------- Theme (dark mode) ---------- */

    var THEME_KEY = "bodalink-theme";
    var themeButton = $("#themeToggle");
    var themeMeta = $('meta[name="theme-color"]');

    function currentTheme() {
        return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        if (themeButton) {
            themeButton.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
            themeButton.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        }
        if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#121821" : "#ffffff");
    }

    applyTheme(currentTheme());

    if (themeButton) {
        themeButton.addEventListener("click", function () {
            var next = currentTheme() === "dark" ? "light" : "dark";
            applyTheme(next);
            store.set(THEME_KEY, next);
        });
    }

    // Follow the operating system until the visitor makes their own choice.
    if (window.matchMedia) {
        var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
        var onSystemChange = function (e) {
            if (!store.get(THEME_KEY)) applyTheme(e.matches ? "dark" : "light");
        };
        if (darkQuery.addEventListener) darkQuery.addEventListener("change", onSystemChange);
        else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
    }

    /* ---------- Mobile menu ---------- */

    var navToggle = $("#navToggle");
    var navPanel = $("#navPanel");

    function setMenu(open) {
        if (!navToggle || !navPanel) return;
        navPanel.classList.toggle("is-open", open);
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (navToggle && navPanel) {
        navToggle.addEventListener("click", function () {
            setMenu(navToggle.getAttribute("aria-expanded") !== "true");
        });

        navPanel.addEventListener("click", function (e) {
            if (e.target.closest("a")) setMenu(false);
        });

        doc.addEventListener("click", function (e) {
            if (navToggle.getAttribute("aria-expanded") !== "true") return;
            if (!e.target.closest("#navPanel") && !e.target.closest("#navToggle")) setMenu(false);
        });

        if (window.matchMedia) {
            var wideQuery = window.matchMedia("(min-width: 861px)");
            var onWide = function (e) {
                if (e.matches) setMenu(false);
            };
            if (wideQuery.addEventListener) wideQuery.addEventListener("change", onWide);
            else if (wideQuery.addListener) wideQuery.addListener(onWide);
        }
    }

    /* ---------- Scroll: progress bar, header shadow, back-to-top ---------- */

    var progressBar = $("#scrollProgress");
    var header = $("#siteHeader");
    var backToTop = $("#backToTop");
    var scrollQueued = false;

    function updateScroll() {
        scrollQueued = false;
        var y = window.pageYOffset || root.scrollTop || 0;
        var max = root.scrollHeight - root.clientHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

        if (progressBar) progressBar.style.transform = "scaleX(" + ratio + ")";
        if (header) header.classList.toggle("is-scrolled", y > 8);
        if (backToTop) backToTop.classList.toggle("is-visible", y > 480);
    }

    function queueScroll() {
        if (scrollQueued) return;
        scrollQueued = true;
        window.requestAnimationFrame(updateScroll);
    }

    window.addEventListener("scroll", queueScroll, { passive: true });
    window.addEventListener("resize", queueScroll);
    updateScroll();

    if (backToTop) {
        backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            var logo = $(".logo");
            if (logo) logo.focus({ preventScroll: true });
        });
    }

    /* ---------- Page loader (first visit in this browser tab) ---------- */

    var loader = $("#pageLoader");

    function hideLoader() {
        if (!loader || loader.classList.contains("is-done")) return;
        loader.classList.add("is-done");
        try {
            window.sessionStorage.setItem("bodalink-loaded", "1");
        } catch (e) {
            /* ignore */
        }
    }

    if (loader) {
        if (root.classList.contains("no-loader")) {
            loader.classList.add("is-done");
        } else {
            var finishLoading = function () {
                var elapsed = window.performance && performance.now ? performance.now() : 0;
                window.setTimeout(hideLoader, Math.max(0, 450 - elapsed));
            };
            if (doc.readyState === "complete") finishLoading();
            else window.addEventListener("load", finishLoading);
            window.setTimeout(hideLoader, 3500);
        }
    }

    /* ---------- Password visibility toggle ---------- */

    var EYE =
        '<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '<svg class="icon-eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 4.1-4.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/></svg>';

    var passwordFields = [];

    $$('input[type="password"]').forEach(function (input, index) {
        if (input.closest(".password-field")) return;
        if (!input.id) input.id = "password-field-" + index;

        var wrap = doc.createElement("div");
        wrap.className = "password-field";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        var button = doc.createElement("button");
        button.type = "button";
        button.className = "password-toggle";
        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-controls", input.id);
        button.innerHTML = EYE;
        wrap.appendChild(button);

        button.addEventListener("click", function () {
            var reveal = input.type === "password";
            input.type = reveal ? "text" : "password";
            button.setAttribute("aria-pressed", reveal ? "true" : "false");
        });

        passwordFields.push({ input: input, button: button });
    });

    function hidePasswords() {
        passwordFields.forEach(function (field) {
            field.input.type = "password";
            field.button.setAttribute("aria-pressed", "false");
        });
    }

    window.addEventListener("pagehide", hidePasswords);

    /* ---------- FAQ ---------- */

    var faqList = $(".faq");

    function openFaqFromHash() {
        var id = decodeURIComponent((window.location.hash || "").slice(1));
        if (!id) return;
        var target = doc.getElementById(id);
        if (target && target.tagName === "DETAILS") {
            target.open = true;
            target.scrollIntoView({ block: "start" });
        }
    }

    if (faqList) {
        var faqItems = $$("details", faqList);
        var faqToggleAll = $("[data-faq-toggle-all]");

        var syncFaqButton = function () {
            if (!faqToggleAll) return;
            var allOpen = faqItems.every(function (d) {
                return d.open;
            });
            faqToggleAll.textContent = allOpen ? "Collapse all" : "Expand all";
        };

        if (faqToggleAll) {
            faqToggleAll.hidden = false;
            faqToggleAll.addEventListener("click", function () {
                var allOpen = faqItems.every(function (d) {
                    return d.open;
                });
                faqItems.forEach(function (d) {
                    d.open = !allOpen;
                });
                syncFaqButton();
            });
            faqItems.forEach(function (d) {
                d.addEventListener("toggle", syncFaqButton);
            });
            syncFaqButton();
        }
    }

    openFaqFromHash();
    window.addEventListener("hashchange", openFaqFromHash);

    /* ---------- Floating contact button ---------- */

    var contactToggle = $("#contactToggle");
    var contactPanel = $("#contactPanel");

    function setContact(open) {
        if (!contactToggle || !contactPanel) return;
        contactPanel.hidden = !open;
        contactToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (contactToggle && contactPanel) {
        contactToggle.addEventListener("click", function () {
            setContact(contactToggle.getAttribute("aria-expanded") !== "true");
        });

        doc.addEventListener("click", function (e) {
            if (contactToggle.getAttribute("aria-expanded") !== "true") return;
            if (!e.target.closest(".contact-fab")) setContact(false);
        });
    }

    /* Escape closes the menu and the contact panel (dialogs handle Escape natively). */
    doc.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;

        if (navToggle && navToggle.getAttribute("aria-expanded") === "true") {
            setMenu(false);
            navToggle.focus();
        }
        if (contactToggle && contactToggle.getAttribute("aria-expanded") === "true") {
            setContact(false);
            contactToggle.focus();
        }
    });

    /* ---------- Cookie banner ---------- */

    var COOKIE_KEY = "bodalink-cookie-notice";
    var cookieBanner = $("#cookieBanner");
    var cookieAccept = $("#cookieAccept");

    function setBannerOffset() {
        if (cookieBanner && !cookieBanner.hidden) {
            root.style.setProperty("--banner-h", cookieBanner.offsetHeight + 16 + "px");
        } else {
            root.style.removeProperty("--banner-h");
        }
    }

    if (cookieBanner && cookieAccept) {
        if (!store.get(COOKIE_KEY)) {
            cookieBanner.hidden = false;
            setBannerOffset();
            window.addEventListener("resize", setBannerOffset);
        }

        cookieAccept.addEventListener("click", function () {
            store.set(COOKIE_KEY, "1");
            cookieBanner.hidden = true;
            setBannerOffset();
        });
    }

    /* ---------- Confirmation modal ---------- */

    var confirmDialog = $("#confirmDialog");
    var confirmResolve = null;
    var confirmAnswer = false;

    function lockScroll(locked) {
        doc.body.classList.toggle("modal-open", locked);
    }

    function askToConfirm(options) {
        var message = options.message || "Are you sure?";

        // Very old browsers without <dialog>: fall back to the built-in prompt.
        if (!confirmDialog || typeof confirmDialog.showModal !== "function") {
            return Promise.resolve(window.confirm(message));
        }

        $("#confirmTitle").textContent = options.title || "Are you sure?";
        $("#confirmMessage").textContent = message;

        var okButton = $("[data-modal-confirm]", confirmDialog);
        okButton.textContent = options.confirmLabel || "Confirm";
        okButton.className = "btn " + (options.tone === "primary" ? "btn--primary" : "btn--danger");

        confirmAnswer = false;
        return new Promise(function (resolve) {
            confirmResolve = resolve;
            confirmDialog.showModal();
            lockScroll(true);
            $("[data-modal-cancel]", confirmDialog).focus(); // safest default for destructive actions
        });
    }

    if (confirmDialog) {
        $("[data-modal-confirm]", confirmDialog).addEventListener("click", function () {
            confirmAnswer = true;
            confirmDialog.close();
        });

        $("[data-modal-cancel]", confirmDialog).addEventListener("click", function () {
            confirmDialog.close();
        });

        // Clicking the dimmed backdrop cancels.
        confirmDialog.addEventListener("click", function (e) {
            if (e.target === confirmDialog) confirmDialog.close();
        });

        confirmDialog.addEventListener("close", function () {
            lockScroll(false);
            var resolve = confirmResolve;
            confirmResolve = null;
            if (resolve) resolve(confirmAnswer);
        });
    }

    doc.addEventListener("click", function (e) {
        var trigger = e.target.closest("[data-confirm]");
        if (!trigger || e.defaultPrevented) return;

        e.preventDefault();

        askToConfirm({
            title: trigger.getAttribute("data-confirm-title"),
            message: trigger.getAttribute("data-confirm"),
            confirmLabel: trigger.getAttribute("data-confirm-label"),
            tone: trigger.getAttribute("data-confirm-tone"),
        }).then(function (ok) {
            if (!ok) return;
            if (trigger.tagName === "A") {
                window.location.href = trigger.href;
                return;
            }
            var form = trigger.form || trigger.closest("form");
            if (!form) return;
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else form.submit();
        });
    });

    /* ---------- Site search ---------- */

    var searchDialog = $("#searchDialog");
    var searchInput = $("#searchInput");
    var searchResults = $("#searchResults");
    var searchStatus = $("#searchStatus");
    var searchAll = $("#searchAll");
    var searchTimer = null;
    var searchController = null;
    var searchSeq = 0;

    function queryTokens(q) {
        return q
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .sort(function (a, b) {
                return b.length - a.length;
            });
    }

    function highlight(text, tokens) {
        var frag = doc.createDocumentFragment();
        if (!tokens.length) {
            frag.appendChild(doc.createTextNode(text));
            return frag;
        }
        var re = new RegExp("(" + tokens.map(escapeRegExp).join("|") + ")", "ig");
        text.split(re).forEach(function (part, i) {
            if (!part) return;
            if (i % 2 === 1) {
                var mark = doc.createElement("mark");
                mark.textContent = part;
                frag.appendChild(mark);
            } else {
                frag.appendChild(doc.createTextNode(part));
            }
        });
        return frag;
    }

    function showSkeleton() {
        searchResults.textContent = "";
        searchResults.setAttribute("aria-busy", "true");
        for (var i = 0; i < 3; i++) {
            var li = doc.createElement("li");
            li.className = "skeleton-row";
            li.innerHTML =
                '<span class="skeleton skeleton--short"></span><span class="skeleton skeleton--long"></span>';
            searchResults.appendChild(li);
        }
    }

    function renderResults(query, data) {
        var tokens = queryTokens(query);
        searchResults.textContent = "";
        searchResults.removeAttribute("aria-busy");

        var items = data.results || [];
        if (!items.length) {
            searchStatus.textContent = "No results for \u201c" + query + "\u201d. Try \u201cfare\u201d, \u201criders\u201d or \u201csafety\u201d.";
            searchAll.hidden = true;
            return;
        }

        items.forEach(function (item) {
            var li = doc.createElement("li");
            var a = doc.createElement("a");
            a.className = "search-result";
            a.href = item.url;

            var type = doc.createElement("span");
            type.className = "search-result__type";
            type.textContent = item.type;

            var title = doc.createElement("span");
            title.className = "search-result__title";
            title.appendChild(highlight(item.title, tokens));

            a.appendChild(type);
            a.appendChild(title);

            if (item.snippet) {
                var snippet = doc.createElement("span");
                snippet.className = "search-result__snippet";
                snippet.appendChild(highlight(item.snippet, tokens));
                a.appendChild(snippet);
            }

            li.appendChild(a);
            searchResults.appendChild(li);
        });

        var total = data.total || items.length;
        searchStatus.textContent = total + (total === 1 ? " result" : " results");
        searchAll.href = "/search?q=" + encodeURIComponent(query);
        searchAll.textContent = "See all results for \u201c" + query + "\u201d";
        searchAll.hidden = false;
    }

    function runSearch() {
        var query = searchInput.value.trim();

        if (searchController) searchController.abort();

        if (query.length < 2) {
            searchResults.textContent = "";
            searchResults.removeAttribute("aria-busy");
            searchAll.hidden = true;
            searchStatus.textContent = query.length ? "Keep typing\u2026" : "Search pages, FAQs, riders and your trips.";
            return;
        }

        var seq = ++searchSeq;
        searchController = typeof AbortController === "function" ? new AbortController() : null;
        searchStatus.textContent = "Searching\u2026";
        showSkeleton();

        window
            .fetch("/api/search?q=" + encodeURIComponent(query), {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
                signal: searchController ? searchController.signal : undefined,
            })
            .then(function (response) {
                if (!response.ok) throw new Error("Search failed");
                return response.json();
            })
            .then(function (data) {
                if (seq !== searchSeq) return; // a newer search has started
                renderResults(query, data);
            })
            .catch(function (error) {
                if (error && error.name === "AbortError") return;
                if (seq !== searchSeq) return;
                searchResults.textContent = "";
                searchResults.removeAttribute("aria-busy");
                searchAll.hidden = true;
                searchStatus.textContent = "Search isn\u2019t working right now. Press Enter to try the full search page.";
            });
    }

    function openSearch() {
        if (!searchDialog || typeof searchDialog.showModal !== "function") {
            window.location.href = "/search";
            return;
        }
        if (!searchDialog.open) {
            searchDialog.showModal();
            lockScroll(true);
        }
        searchInput.focus();
        searchInput.select();
    }

    if (searchDialog && searchInput && searchResults && searchStatus && searchAll) {
        $$("[data-search-open]").forEach(function (opener) {
            opener.addEventListener("click", function (e) {
                e.preventDefault();
                openSearch();
            });
        });

        searchInput.addEventListener("input", function () {
            window.clearTimeout(searchTimer);
            searchTimer = window.setTimeout(runSearch, 200);
        });

        searchDialog.addEventListener("click", function (e) {
            if (e.target === searchDialog) searchDialog.close();
            // Following a result on the page we are already on (e.g. /#faq) should close the dialog.
            if (e.target.closest(".search-result, .search-all")) searchDialog.close();
        });

        searchDialog.addEventListener("close", function () {
            lockScroll(false);
        });

        // Arrow keys move between the input and the results.
        searchDialog.addEventListener("keydown", function (e) {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            var links = $$(".search-result, .search-all:not([hidden])", searchDialog);
            if (!links.length) return;
            var index = links.indexOf(doc.activeElement);
            e.preventDefault();
            if (e.key === "ArrowDown") {
                links[Math.min(links.length - 1, index + 1)].focus();
            } else if (index <= 0) {
                searchInput.focus();
            } else {
                links[index - 1].focus();
            }
        });

        // "/" or Ctrl/Cmd+K opens search from anywhere.
        doc.addEventListener("keydown", function (e) {
            var isSlash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey;
            var isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
            if (!isSlash && !isCtrlK) return;
            if (isSlash && isEditable(doc.activeElement)) return;
            if (doc.querySelector("dialog[open]")) return;
            e.preventDefault();
            openSearch();
        });

        searchStatus.textContent = "Search pages, FAQs, riders and your trips.";
    }

    /* ---------- Newsletter signup ---------- */

    $$("[data-newsletter]").forEach(function (form) {
        var input = $('input[type="email"]', form);
        var button = $('button[type="submit"]', form);
        var errorBox = $("[data-newsletter-error]", form);
        var success = form.parentNode.querySelector("[data-newsletter-success]");
        var busy = false;

        function showError(message) {
            errorBox.textContent = message;
            input.setAttribute("aria-invalid", "true");
            input.focus();
        }

        function clearError() {
            errorBox.textContent = "";
            input.removeAttribute("aria-invalid");
        }

        input.addEventListener("input", clearError);

        form.addEventListener("submit", function (e) {
            if (typeof window.fetch !== "function" || typeof URLSearchParams !== "function") return; // plain form post
            e.preventDefault();
            if (busy) return;

            clearError();
            var email = input.value.trim();
            if (!email || !input.checkValidity()) {
                showError("Enter a valid email address, like name@example.com.");
                return;
            }

            busy = true;
            button.classList.add("is-loading");
            button.setAttribute("aria-disabled", "true");

            var body = new URLSearchParams();
            body.set("email", email);
            var trap = $('input[name="website"]', form);
            if (trap) body.set("website", trap.value);

            window
                .fetch(form.getAttribute("action") || "/newsletter", {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
                    credentials: "same-origin",
                    body: body.toString(),
                })
                .then(function (response) {
                    return response
                        .json()
                        .catch(function () {
                            return {};
                        })
                        .then(function (data) {
                            return { ok: response.ok, data: data };
                        });
                })
                .then(function (result) {
                    if (!result.ok) {
                        showError(result.data.message || "Something went wrong. Please try again.");
                        return;
                    }
                    form.hidden = true;
                    if (success) {
                        success.hidden = false;
                        success.focus();
                    }
                })
                .catch(function () {
                    showError("Couldn\u2019t reach the server. Check your connection and try again.");
                })
                .then(function () {
                    busy = false;
                    button.classList.remove("is-loading");
                    button.removeAttribute("aria-disabled");
                });
        });
    });

    /* ---------- Copy-to-clipboard for code snippets ---------- */

    function fallbackCopy(text) {
        var area = doc.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
        doc.body.appendChild(area);
        area.select();
        var ok = false;
        try {
            ok = doc.execCommand("copy");
        } catch (e) {
            ok = false;
        }
        doc.body.removeChild(area);
        return ok;
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(
                function () {
                    return true;
                },
                function () {
                    return fallbackCopy(text);
                }
            );
        }
        return Promise.resolve(fallbackCopy(text));
    }

    $$("pre").forEach(function (pre) {
        if (pre.closest(".code-block")) return;

        var wrap = doc.createElement("div");
        wrap.className = "code-block";
        pre.parentNode.insertBefore(wrap, pre);

        var button = doc.createElement("button");
        button.type = "button";
        button.className = "code-copy";
        button.textContent = "Copy";
        button.setAttribute("aria-label", "Copy code to clipboard");

        wrap.appendChild(button);
        wrap.appendChild(pre);

        var resetTimer = null;
        button.addEventListener("click", function () {
            var source = pre.querySelector("code") || pre;
            copyText(source.textContent).then(function (ok) {
                button.textContent = ok ? "Copied" : "Copy failed";
                button.classList.toggle("is-copied", ok);
                toast(ok ? "Code copied to clipboard" : "Couldn\u2019t copy. Select the text and copy it manually.");
                window.clearTimeout(resetTimer);
                resetTimer = window.setTimeout(function () {
                    button.textContent = "Copy";
                    button.classList.remove("is-copied");
                }, 2000);
            });
        });
    });

    /* ---------- UTM tracking on outbound links ---------- */

    function campaignName() {
        var path = window.location.pathname.replace(/^\/+|\/+$/g, "");
        return path ? path.replace(/[^a-z0-9]+/gi, "-").toLowerCase() : "home";
    }

    function placementOf(link) {
        if (link.closest("footer")) return "footer";
        if (link.closest("header")) return "header";
        if (link.closest(".contact-fab")) return "contact_button";
        return "content";
    }

    function addUtm(link) {
        var href = link.getAttribute("href");
        if (!href || !/^https?:\/\//i.test(href)) return;

        var url;
        try {
            url = new URL(link.href);
        } catch (e) {
            return;
        }
        if (url.host === window.location.host) return;
        if (url.searchParams.has("utm_source")) return; // already tagged: leave it alone

        url.searchParams.set("utm_source", "bodalink");
        url.searchParams.set("utm_medium", "referral");
        url.searchParams.set("utm_campaign", link.getAttribute("data-utm-campaign") || campaignName());
        url.searchParams.set("utm_content", link.getAttribute("data-utm-content") || placementOf(link));
        link.href = url.toString();

        if (link.target === "_blank" && !/noopener/.test(link.rel)) {
            link.rel = (link.rel + " noopener noreferrer").trim();
        }
    }

    function tagOutboundLinks(scope) {
        $$("a[href]", scope || doc).forEach(addUtm);
    }

    tagOutboundLinks();

    /* ---------- Loading state on submit buttons ---------- */

    function resetSubmitting() {
        $$("form[data-submitting]").forEach(function (form) {
            form.removeAttribute("data-submitting");
            form.removeAttribute("aria-busy");
            $$(".is-loading", form).forEach(function (btn) {
                btn.classList.remove("is-loading");
                btn.removeAttribute("aria-disabled");
                if (btn.hasAttribute("data-original-text")) {
                    btn.textContent = btn.getAttribute("data-original-text");
                    btn.removeAttribute("data-original-text");
                }
            });
        });
    }

    doc.addEventListener("submit", function (e) {
        var form = e.target;
        if (!form || form.tagName !== "FORM") return;
        if (form.hasAttribute("data-no-loading")) return;

        if (e.defaultPrevented) return; // validation stopped it

        if (form.hasAttribute("data-submitting")) {
            e.preventDefault(); // already sending: ignore double clicks
            return;
        }

        form.setAttribute("data-submitting", "1");
        form.setAttribute("aria-busy", "true");

        var button = e.submitter || $('button[type="submit"]', form);
        if (button) {
            button.classList.add("is-loading");
            button.setAttribute("aria-disabled", "true");
            var loadingText = button.getAttribute("data-loading-text");
            if (loadingText) {
                button.setAttribute("data-original-text", button.textContent);
                button.textContent = loadingText;
            }
        }
    });

    // Coming back with the browser's Back button must not show a stuck spinner.
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            resetSubmitting();
            hideLoader();
        }
    });

    /* ---------- Printing: open every FAQ answer, then restore ---------- */

    var closedBeforePrint = [];

    window.addEventListener("beforeprint", function () {
        closedBeforePrint = $$("details").filter(function (d) {
            return !d.open;
        });
        closedBeforePrint.forEach(function (d) {
            d.open = true;
        });
    });

    window.addEventListener("afterprint", function () {
        closedBeforePrint.forEach(function (d) {
            d.open = false;
        });
        closedBeforePrint = [];
    });

    /* ---------- Tiny public API for other scripts ---------- */

    window.BodaLink = {
        copyText: copyText,
        confirm: askToConfirm,
        tagOutboundLinks: tagOutboundLinks,
        toast: toast,
    };
})();
