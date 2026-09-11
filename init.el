;;; init.el --- Emacs configuration for Chamada Online project -*- lexical-binding: t; -*-

;; ==============================================================================
;; 1. GERENCIAMENTO DE PACOTES (MELPA & use-package)
;; ==============================================================================
(require 'package)
(setq package-archives '(("melpa"  . "https://melpa.org/packages/")
                         ("gnu"    . "https://elpa.gnu.org/packages/")
                         ("nongnu" . "https://elpa.nongnu.org/nongnu/")))
(package-initialize)

;; Atualiza arquivos de pacotes na primeira execução
(unless package-archive-contents
  (package-refresh-contents))

;; Garante que o use-package esteja instalado
(unless (package-installed-p 'use-package)
  (package-install 'use-package))

(require 'use-package)
(setq use-package-always-ensure t)

;; ==============================================================================
;; 2. INTERFACE E CONFIGURAÇÕES BÁSICAS
;; ==============================================================================
(setq inhibit-startup-message t)
(setq ring-bell-function 'ignore)
(setq make-backup-files nil)            ; Evita arquivos backup~
(setq auto-save-default nil)            ; Evita arquivos #autosave#
(global-auto-revert-mode 1)             ; Recarrega arquivos se mudarem no disco

(when (fboundp 'tool-bar-mode) (tool-bar-mode -1))
(when (fboundp 'scroll-bar-mode) (scroll-bar-mode -1))
(when (fboundp 'menu-bar-mode) (menu-bar-mode -1))

(global-display-line-numbers-mode 1)
(column-number-mode 1)
(show-paren-mode 1)
(electric-pair-mode 1)

;; Guia de atalhos em tempo real (which-key)
(use-package which-key
  :init (which-key-mode)
  :config
  (setq which-key-idle-delay 0.3))

;; Tema e ícones
(use-package doom-themes
  :config
  (load-theme 'doom-one t))

;; ==============================================================================
;; 3. MAGIT (CONTROLE DE VERSÃO GIT PODEROSO)
;; ==============================================================================
(use-package magit
  :bind (("C-x g"   . magit-status)
         ("C-x M-g" . magit-dispatch)
         ("C-c g b" . magit-blame))
  :config
  (setq magit-display-buffer-function #'magit-display-buffer-same-window-except-diff-v1))

;; ==============================================================================
;; 4. TREEMACS (ÁRVORE DE ARQUIVOS LATERAL)
;; ==============================================================================
(use-package treemacs
  :hook (emacs-startup . treemacs)
  :bind
  (("M-0"       . treemacs-select-window)
   ("C-x t 1"   . treemacs-delete-other-windows)
   ("C-x t t"   . treemacs)
   ("C-x t b"   . treemacs-bookmark)
   ("C-x t C-t" . treemacs-find-file)
   ("<f8>"      . treemacs))
  :config
  (treemacs-start-on-boot)
  (setq treemacs-collapse-dirs                 (if treemacs-python-executable 3 0)
        treemacs-deferred-git-apply-delay      0.5
        treemacs-directory-name-transformer    #'identity
        treemacs-display-in-side-window        t
        treemacs-eldoc-display                 'simple
        treemacs-file-event-delay              2000
        treemacs-file-extension-regex          treemacs-last-period-regex-value
        treemacs-file-follow-delay             0.2
        treemacs-file-name-transformer         #'identity
        treemacs-follow-after-init             t
        treemacs-expand-after-init             t
        treemacs-git-command-pipe              ""
        treemacs-goto-tag-strategy             'refetch-index
        treemacs-indentation                   2
        treemacs-indentation-string            " "
        treemacs-is-never-other-window         nil
        treemacs-max-git-entries               5000
        treemacs-missing-project-action        'ask
        treemacs-move-files-by-mouse-dragging  t
        treemacs-move-forward-on-expand        nil
        treemacs-no-png-images                 nil
        treemacs-no-delete-other-windows       t
        treemacs-project-follow-cleanup        nil
        treemacs-persist-file                  (expand-file-name ".cache/treemacs-persist" user-emacs-directory)
        treemacs-position                      'left
        treemacs-recenter-distance             0.1
        treemacs-recenter-after-file-follow    nil
        treemacs-recenter-after-tag-follow     nil
        treemacs-recenter-after-project-jump   'always
        treemacs-recenter-after-project-expand 'on-distance
        treemacs-show-cursor                   nil
        treemacs-show-hidden-files             t
        treemacs-silent-filewatch              nil
        treemacs-silent-refresh                nil
        treemacs-sorting                       'alphabetic-asc
        treemacs-select-when-already-in-treemacs 'move-back
        treemacs-space-between-root-nodes      t
        treemacs-tag-follow-cleanup            t
        treemacs-tag-follow-delay              1.5
        treemacs-text-scale                    nil
        treemacs-user-mode-line-format         'none
        treemacs-user-header-line-format       nil
        treemacs-wide-toggle-width             70
        treemacs-width                         30
        treemacs-width-increment               1
        treemacs-width-is-initially-locked     t
        treemacs-workspace-switch-cleanup      nil))

(use-package treemacs-magit
  :after (treemacs magit))

;; ==============================================================================
;; 5. DIRED MELHORADO (EXPLORADOR DE ARQUIVOS POTENTE)
;; ==============================================================================
(use-package dired
  :ensure nil                           ; dired é nativo do Emacs
  :bind (:map dired-mode-map
              ("RET" . dired-find-alternate-file) ; Abre diretório no mesmo buffer (evita acumular buffers)
              ("^"   . (lambda () (interactive) (find-alternate-file ".."))) ; Volta pasta no mesmo buffer
              ("e"   . wdired-change-to-wdired-mode) ; Atalho rápido para renomear em lote
              ("h"   . dired-hide-details-mode))     ; Oculta/exibe detalhes de permissão/data
  :config
  ;; Permite reusar o mesmo buffer ao navegar
  (put 'dired-find-alternate-file 'disabled nil)

  ;; Agrupa pastas primeiro e mostra formatos humanos (-h)
  (setq dired-listing-switches "-alh --group-directories-first")

  ;; Dired DWIM (Do What I Mean):
  ;; Se houver 2 janelas Dired abertas lado a lado, ao copiar (C) ou mover (R),
  ;; o Emacs sugere automaticamente a pasta da outra janela como destino!
  (setq dired-dwim-target t)

  ;; Não pede confirmação infinita ao copiar/deletar pastas recursivamente
  (setq dired-recursive-copies 'always)
  (setq dired-recursive-deletes 'top)

  ;; Recarrega a listagem do dired automaticamente quando arquivos mudam
  (setq dired-auto-revert-buffer t))

;; Dired-x (Extensões úteis do Dired)
(use-package dired-x
  :ensure nil
  :after dired
  :config
  ;; Oculta arquivos ignorados (.git, node_modules) com a tecla 'C-x M-o'
  (setq dired-omit-files "^\\...+$")
  (add-hook 'dired-mode-hook (lambda () (dired-omit-mode 1))))

;; WDired (Writable Dired): Permite renomear arquivos como se fosse um arquivo de texto comum!
(use-package wdired
  :ensure nil
  :after dired
  :config
  (setq wdired-allow-to-change-permissions t)
  (setq wdired-create-parent-directories t))

;; ==============================================================================
;; 6. BUSCA E NAVEGAÇÃO RÁPIDA DE ARQUIVOS NO PROJETO
;; ==============================================================================
;; Vertico + Marginalia + Consult (Autocompletion moderno e rápido)
(use-package vertico
  :init (vertico-mode))

(use-package savehist
  :init (savehist-mode))

(use-package marginalia
  :after vertico
  :init (marginalia-mode))

(use-package consult
  :bind (("C-s"   . consult-line)       ; Busca de texto no buffer atual
         ("C-x b" . consult-buffer)     ; Troca de buffer interativa
         ("M-g g" . consult-goto-line))
  :config
  (setq consult-narrow-key "<"))

(use-package orderless
  :init
  (setq completion-styles '(orderless basic)
        completion-category-defaults nil
        completion-category-overrides '((file (styles partial-completion)))))

;; ==============================================================================
;; 7. YASNIPPET & SNIPPETS (LATEX, ORG-MODE, TEMPLATES)
;; ==============================================================================
(use-package yasnippet
  :init
  (yas-global-mode 1)
  :config
  ;; Adiciona a pasta de snippets do projeto e a pasta padrão ~/.emacs.d/snippets
  (let ((project-snippets (expand-file-name "snippets" (file-name-directory (or load-file-name buffer-file-name default-directory))))
        (user-snippets (expand-file-name "snippets" user-emacs-directory)))
    (setq yas-snippet-dirs (delete-dups (list user-snippets project-snippets))))
  (yas-reload-all)
  :bind (("C-c y i" . yas-insert-snippet)
         ("C-c y n" . yas-new-snippet)
         ("C-c y v" . yas-visit-snippet-file)))

;; Coleção comunitária abrangente de snippets (inclui LaTeX, JS, TS, HTML, Python, etc.)
(use-package yasnippet-snippets
  :after yasnippet)

;; ==============================================================================
;; 8. SUPORTE A ORG-MODE (DOCUMENTAÇÃO, IMAGENS & TEMPLATES DE EXPORTAÇÃO)
;; ==============================================================================
(use-package org
  :ensure nil
  :bind (:map org-mode-map
              ("C-c C-x C-v" . org-toggle-inline-images))
  :config
  (setq org-ellipsis " ▾")
  (setq org-hide-emphasis-markers t)
  (setq org-src-fontify-natively t)
  (setq org-src-tab-acts-natively t)
  (setq org-image-actual-width '(600))  ; Redimensiona visualização de imagens grandes no buffer

  ;; Habilita expansão rápida de blocos com '<' (ex: <s TAB para #+begin_src, <e TAB para #+begin_example)
  (require 'org-tempo)

  ;; Template rápido do org-tempo para inserção de imagem com atributos de exportação:
  ;; Digite '<img' e pressione TAB em um arquivo .org
  (add-to-list 'org-structure-template-alist
               '("img" . "CAPTION: ?\n#+NAME: fig:rotulo\n#+ATTR_HTML: :width 800px :align center\n#+ATTR_LATEX: :width 0.8\\textwidth :placement [htbp]\n#+ATTR_ORG: :width 600\n[[./images/?]]")))

;; Suporte e visualização de LaTeX
(use-package auctex
  :defer t
  :ensure t
  :hook ((LaTeX-mode . turn-on-reftex)
         (LaTeX-mode . prettify-symbols-mode)))

;;; init.el ends here
