export function initComposition(workspace) {
  const mosaic = workspace.querySelector("[data-mosaic-board]");
    const mosaicStatus = workspace.querySelector("[data-mosaic-status]");
    const announceMosaic = (message) => { if (mosaicStatus) mosaicStatus.textContent = message; };
    const gridTrackCount = () => window.matchMedia("(max-width: 680px)").matches ? 24 : 48;
    let knownGridTrackCount = 48;

    const mosaicWidgets = () => [...(mosaic?.querySelectorAll("[data-widget]") || [])];
    const renderMosaicRows = () => {
      if (!mosaic) return;
      const widgets = mosaicWidgets();
      const tracks = gridTrackCount();
      mosaic.replaceChildren();
      for (let index = 0; index < widgets.length;) {
        const row = document.createElement("div");
        row.className = "mosaic-row";
        row.dataset.mosaicRow = "";
        const firstWidth = Math.max(1, Number(widgets[index].dataset.cols) || tracks / 2);
        const pair = firstWidth >= tracks ? [widgets[index]] : widgets.slice(index, index + 2);
        const desired = pair.map((widget) => Math.max(1, Number(widget.dataset.cols) || tracks / 2));
        const total = desired.reduce((sum, cols) => sum + cols, 0);
        const normalized = pair.length === 1 ? [tracks] : [
          Math.max(1, Math.round(desired[0] * tracks / total)),
          tracks - Math.max(1, Math.round(desired[0] * tracks / total))
        ];
        const rowHeight = Math.max(8, ...pair.map((widget) => Number(widget.dataset.rows) || 8));
        pair.forEach((widget, pairIndex) => {
          widget.dataset.cols = String(normalized[pairIndex]);
          widget.dataset.rows = String(rowHeight);
          row.append(widget);
        });
        mosaic.append(row);
        index += pair.length;
      }
    };
    const reorderWidget = (widget, target) => {
      if (!mosaic || !target || widget === target) return;
      const widgets = mosaicWidgets();
      const from = widgets.indexOf(widget);
      const to = widgets.indexOf(target);
      if (from < 0 || to < 0) return;
      [widgets[from], widgets[to]] = [widgets[to], widgets[from]];
      widgets.forEach((item) => mosaic.append(item));
      renderMosaicRows();
      mosaic.dispatchEvent(new CustomEvent("vestiges:composition-order", { detail: { order: mosaicWidgets().map(item => item.dataset.widgetKey) } }));
    };

    const dropTargetAt = (x, y, movingWidget) => {
      const candidates = mosaicWidgets().filter((widget) => widget !== movingWidget);
      if (!candidates.length) return null;
      const positioned = candidates.map((widget) => {
        const rect = widget.getBoundingClientRect();
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom);
        return { widget, rect, distance: Math.hypot(dx, dy) };
      });
      const hovered = positioned.find(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
      if (hovered) return hovered;
      const nearest = positioned.sort((a, b) => a.distance - b.distance)[0];
      return nearest.distance <= 32 ? nearest : null;
    };

    const installMosaicInteractions = () => {
      if (!mosaic) return;
      const resizeEdges = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
      mosaic.querySelectorAll("[data-widget]").forEach((widget, index) => {
        if (widget.dataset.compositionBound) return;
        widget.dataset.compositionBound = "true";
        widget.tabIndex = 0;
        widget.setAttribute("aria-roledescription", "bloc déplaçable");
        widget.setAttribute("aria-label", `${widget.querySelector(".widget-top span")?.textContent || `Fenêtre ${index + 1}`} — maintenir une zone non interactive pour déplacer`);
        resizeEdges.forEach((edge) => {
          const handle = document.createElement("span");
          handle.className = `widget-resize-handle widget-resize-handle--${edge}`;
          handle.dataset.resizeHandle = edge;
          handle.setAttribute("aria-hidden", "true");
          widget.append(handle);
        });

        let gesture = null;
        let holdTimer = 0;

        const finishGesture = (cancelled = false) => {
          if (!gesture) return;
          const pointerId = gesture.pointerId;
          window.clearTimeout(holdTimer);
          if (gesture.kind === "move" && !cancelled && gesture.didMove) {
            announceMosaic(`Fenêtre déposée : ${widget.querySelector(".widget-top span")?.textContent || "élément"}.`);
          }
          widget.classList.remove("is-resizing", "is-dragging", "is-selected", "is-pressing");
          delete widget.dataset.dragX;
          delete widget.dataset.dragY;
          if (widget.dataset.keyboardMoving !== "true") widget.removeAttribute("aria-description");
          widget.querySelectorAll(".widget-resize-handle.is-active").forEach((handle) => handle.classList.remove("is-active"));
          widget.removeAttribute("data-resize-active");
          widget.removeAttribute("data-resize-edge");
          if (widget.dataset.keyboardMoving !== "true") widget.removeAttribute("aria-description");
          gesture = null;
          try { if (widget.hasPointerCapture(pointerId)) widget.releasePointerCapture(pointerId); } catch (_error) { /* Le pointeur peut déjà être relâché. */ }
        };

        widget.addEventListener("pointerleave", () => {
          if (!gesture) {
            widget.removeAttribute("data-resize-edge");
          }
        });
        widget.addEventListener("pointermove", (event) => {
          if (gesture?.pointerId === event.pointerId) {
            gesture.lastX = event.clientX;
            gesture.lastY = event.clientY;
            if (gesture.kind === "pending-move" && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 12) {
              finishGesture(true);
              return;
            }
            if (gesture.kind === "resize") {
              const tracks = gridTrackCount();
              const boardStyle = getComputedStyle(mosaic);
              const firstColumn = parseFloat(boardStyle.gridTemplateColumns.split(" ")[0]) || mosaic.clientWidth / tracks;
              const columnPitch = firstColumn + parseFloat(boardStyle.columnGap || "0");
              const rowPitch = (parseFloat(boardStyle.gridAutoRows) || 8) + parseFloat(boardStyle.rowGap || "0");
              const edge = gesture.edge;
              const colsDelta = Math.round((event.clientX - gesture.startX) / columnPitch) * ((edge.includes("e") ? 1 : 0) - (edge.includes("w") ? 1 : 0));
              const rowsDelta = Math.round((event.clientY - gesture.startY) / rowPitch) * ((edge.includes("s") ? 1 : 0) - (edge.includes("n") ? 1 : 0));
              const minCols = tracks === 24 ? 7 : 5;
              const row = widget.closest("[data-mosaic-row]");
              const neighbor = [...(row?.querySelectorAll("[data-widget]") || [])].find((item) => item !== widget);
              const requestedCols = Math.max(minCols, Math.min(tracks - (neighbor ? minCols : 0), gesture.startCols + colsDelta));
              widget.dataset.cols = String(requestedCols);
              if (neighbor) neighbor.dataset.cols = String(tracks - requestedCols);
              const rowHeight = String(Math.max(8, Math.min(60, gesture.startRows + rowsDelta)));
              row?.querySelectorAll("[data-widget]").forEach((item) => { item.dataset.rows = rowHeight; });
            } else if (gesture.kind === "move") {
              const deltaX = event.clientX - gesture.startX;
              const deltaY = event.clientY - gesture.startY;
              widget.dataset.dragX = String(deltaX);
              widget.dataset.dragY = String(deltaY);
              const target = dropTargetAt(event.clientX, event.clientY, widget);
              if (target && Math.hypot(deltaX, deltaY) > 16) {
                gesture.didMove = true;
                if (gesture.lastTarget !== target.widget) {
                  reorderWidget(widget, target.widget);
                  gesture.lastTarget = target.widget;
                  gesture.startX = event.clientX;
                  gesture.startY = event.clientY;
                  widget.dataset.dragX = "0";
                  widget.dataset.dragY = "0";
                }
              }
            }
            return;
          }
          const handle = event.target.closest("[data-resize-handle]");
          if (handle) widget.dataset.resizeEdge = handle.dataset.resizeHandle;
          else widget.removeAttribute("data-resize-edge");
        });
        widget.addEventListener("pointerdown", (event) => {
          const resizeHandle = event.target.closest("[data-resize-handle]");
          if (resizeHandle) {
            event.preventDefault();
            const startCols = Number(widget.dataset.cols);
            const startRows = Number(widget.dataset.rows);
            gesture = { kind: "resize", edge: resizeHandle.dataset.resizeHandle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, startCols, startRows };
            widget.dataset.resizeActive = gesture.edge.split("").join(" ");
            resizeHandle.classList.add("is-active");
            widget.classList.add("is-resizing");
            widget.setPointerCapture(event.pointerId);
            return;
          }
          if (event.target.closest('a, button, input, select, textarea, summary, canvas, [contenteditable="true"], [data-mosaic-no-drag], [data-resize-handle]')) return;
          event.preventDefault();
          gesture = { kind: "pending-move", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY };
          widget.classList.add("is-pressing");
          widget.setPointerCapture(event.pointerId);
          holdTimer = window.setTimeout(() => {
            if (gesture?.kind !== "pending-move") return;
            gesture.kind = "move";
            gesture.didMove = false;
            widget.classList.remove("is-pressing");
            widget.classList.add("is-selected", "is-dragging");
            widget.setAttribute("aria-description", "Sélectionnée pour être déplacée. Glissez-la sur une autre fenêtre ou appuyez sur Échap.");
            announceMosaic("Fenêtre sélectionnée. Glissez-la sur une autre pour échanger leur place, puis relâchez.");
          }, 320);
        });
        widget.addEventListener("pointerup", (event) => {
          if (gesture?.pointerId === event.pointerId) { gesture.lastX = event.clientX; gesture.lastY = event.clientY; }
          finishGesture();
        });
        widget.addEventListener("pointercancel", () => finishGesture(true));
        widget.addEventListener("lostpointercapture", () => { if (gesture) finishGesture(true); });
        widget.addEventListener("keydown", (event) => {
          if (event.target !== widget) return;
          if ([" ", "Enter"].includes(event.key)) {
            event.preventDefault();
            const moving = widget.dataset.keyboardMoving !== "true";
            widget.dataset.keyboardMoving = String(moving);
            if (moving) widget.setAttribute("aria-description", "Déplacement clavier activé. Utilisez les flèches ; Maj plus flèche redimensionne ; Échap termine.");
            else widget.removeAttribute("aria-description");
            widget.classList.toggle("is-keyboard-moving", moving);
            announceMosaic(moving ? "Déplacement clavier activé. Utilisez les flèches ; Maj plus flèche redimensionne. Échap termine." : "Déplacement clavier terminé.");
            return;
          }
          if (event.key === "Escape" && widget.dataset.keyboardMoving === "true") {
            widget.dataset.keyboardMoving = "false";
            widget.removeAttribute("aria-description");
            widget.classList.remove("is-keyboard-moving");
            announceMosaic("Déplacement clavier terminé.");
            return;
          }
          if (widget.dataset.keyboardMoving !== "true" || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          if (event.shiftKey) {
            const colsAxis = ["ArrowLeft", "ArrowRight"].includes(event.key);
            const key = colsAxis ? "cols" : "rows";
            const delta = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
            const maximum = key === "cols" ? gridTrackCount() : 60;
            const minimum = key === "cols" ? gridTrackCount() === 24 ? 7 : 5 : 8;
            const nextSize = Math.max(minimum, Math.min(maximum, Number(widget.dataset[key]) + delta));
            if (key === "rows") {
              widget.closest("[data-mosaic-row]")?.querySelectorAll("[data-widget]").forEach((item) => { item.dataset.rows = String(nextSize); });
            } else {
              const row = widget.closest("[data-mosaic-row]");
              const neighbor = [...(row?.querySelectorAll("[data-widget]") || [])].find((item) => item !== widget);
              const adjustedSize = Math.min(nextSize, maximum - (neighbor ? minimum : 0));
              widget.dataset.cols = String(adjustedSize);
              if (neighbor) neighbor.dataset.cols = String(maximum - adjustedSize);
            }
            announceMosaic(`Fenêtre redimensionnée : ${widget.dataset.cols} colonnes par ${widget.dataset.rows} rangées.`);
          } else {
            const widgets = mosaicWidgets();
            const currentIndex = widgets.indexOf(widget);
            const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
            const target = widgets[currentIndex + delta];
            if (target) reorderWidget(widget, target);
            announceMosaic("Ordre des fenêtres modifié.");
          }
        });
      });
    };

    const syncMosaicTracks = () => {
      if (!mosaic) return;
      const nextTrackCount = gridTrackCount();
      if (nextTrackCount !== knownGridTrackCount) {
        mosaic.querySelectorAll("[data-widget]").forEach((widget) => {
          widget.dataset.cols = String(Math.max(3, Math.round(Number(widget.dataset.cols) * nextTrackCount / knownGridTrackCount)));
        });
        knownGridTrackCount = nextTrackCount;
        renderMosaicRows();
      }
    };


  const refresh = () => { renderMosaicRows(); installMosaicInteractions(); syncMosaicTracks(); };
  window.addEventListener("resize", syncMosaicTracks, { passive: true });
  refresh();
  return { refresh, announce: announceMosaic };
}
