TOPDIR=$( pwd )
SLIMDIR="$TOPDIR/slim"
SRCDIR="$TOPDIR/src"

# Creates the "slim" distribution for browsers. Assumes a PrecompiledLoader will be used.
# The tsc/Webpack combination makes life difficult, so its easiest to copy everything into a
# fresh directory
#
# TODO better not to use Bash script... not portable

cd "${SLIMDIR}"
rm -rf dist/ loaders/ runtime/ slim.ts

# Copy over the "slim" files. 

cd "${SRCDIR}"
cp slim.ts "${SLIMDIR}/"

cd "${SRCDIR}/loaders"
mkdir -p "${SLIMDIR}/loaders"
cp Loader.ts PrecompiledLoader.ts ${SLIMDIR}/loaders/

cd "${SRCDIR}/runtime"
mkdir -p "${SLIMDIR}/runtime"
cp Context.ts Filters.ts Frame.ts SafeString.ts SlimEnvironment.ts SlimTemplate.ts \
	TemplateError.ts globals.ts lib.ts runtime.ts tests.ts tsGlobals.ts \
	${SLIMDIR}/runtime/

# Compile the files:

cd "${SLIMDIR}"

# Copy the build files into the top dist/

npx webpack build --config ./webpack.js
cd ..
mkdir -p dist
cp slim/dist/nunjucks-slim.js dist/

