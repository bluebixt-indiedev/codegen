# Configuration file for the Sphinx documentation builder.

import os
import sys
from datetime import date

# Add your project root to sys.path
sys.path.insert(0, os.path.abspath(".."))

# -- Project information -----------------------------------------------------
project = "Codegen Docs"
author = "Rogge Ramos"
copyright = f"{date.today().year}, {author}"
version = "0.1.0"
release = version

# -- General configuration ---------------------------------------------------
extensions = [
    "sphinx.ext.autodoc",        # from docstrings
    "sphinx.ext.napoleon",       # Google / NumPy style docstrings
    "sphinx.ext.viewcode",       # add links to source
    "sphinx.ext.autosummary",
    "sphinx.ext.intersphinx",
    "sphinx.ext.todo",
    "myst_parser",                # Markdown support, optional
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# -- Options for autodoc / autosummary ---------------------------------------
autosummary_generate = True
autodoc_default_options = {
    "members": True,
    "undoc-members": True,
    "show-inheritance": True,
    "inherited-members": True,
}

# -- Options for HTML output -------------------------------------------------
html_theme = "furo"  # clean, modern. Alternatives: "sphinx_rtd_theme", "pydata_sphinx_theme"
html_static_path = ["_static"]
html_title = f"{project} {version}"

# Optional: link to other docs
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
}

# -- Options for MyST --------------------------------------------------------
myst_enable_extensions = [
    "colon_fence",
    "deflist",
]
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}
