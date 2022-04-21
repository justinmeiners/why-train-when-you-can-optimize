
.PHONY: clean all

all: docs/index.html docs/math.html docs/src/main.js docs/src/math.js

docs/google-code-prettify docs/katex:
	srcweave-format-init -m docs

docs/src/main.js docs/src/math.js: index.lit template.lit math.lit
	srcweave --tangle ./docs/src/ $^

# separate weaving of tutorial and libraries so they have 
# separate TOCs#

docs/index.html: index.lit
	srcweave --weave ./docs/ --formatter srcweave-format $^

docs/math.html docs/template.html: template.lit math.lit
	srcweave --weave ./docs/ --formatter srcweave-format $^

clean:
	rm -f docs/src/main.js
	rm -f docs/*.html
