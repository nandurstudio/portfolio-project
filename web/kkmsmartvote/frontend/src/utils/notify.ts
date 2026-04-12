import Swal from "sweetalert2";

const baseOptions = {
  confirmButtonColor: "#1d709f",
  returnFocus: false,
  focusConfirm: true,
  customClass: {
    popup: "kkm-swal-popup",
  },
  didOpen: () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === "function") {
      active.blur();
    }
  },
};

export const notify = {
  success: (title: string, text?: string) =>
    Swal.fire({
      ...baseOptions,
      icon: "success",
      title,
      text,
    }),

  error: (title: string, text?: string) =>
    Swal.fire({
      ...baseOptions,
      icon: "error",
      title,
      text,
    }),

  warning: (title: string, text?: string) =>
    Swal.fire({
      ...baseOptions,
      icon: "warning",
      title,
      text,
    }),

  info: (title: string, text?: string) =>
    Swal.fire({
      ...baseOptions,
      icon: "info",
      title,
      text,
    }),

  confirm: (
    title: string,
    text?: string,
    confirmButtonText = "Ya, lanjutkan",
    cancelButtonText = "Batal",
  ) =>
    Swal.fire({
      ...baseOptions,
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    }),
};
