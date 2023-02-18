TOPDIR=$( pwd )
SRCDIR="$TOPDIR/src"
SLIMDIR="$TOPDIR/slim"
SLIMBUILD="$TOPDIR/slimBuild"

# Creates the "slim" distribution for browsers. Assumes a PrecompiledLoader will be used.
# The tsc/Webpack combination makes life difficult, so its easiest to copy everything into a
# fresh directory
#
# TODO better not to use Bash script... not portable

# Clean up the old slim build directory:
rm -rf "${SLIMBUILD}"

# Copy over the slim specific files:
cp -r "${SLIMDIR}" "${SLIMBUILD}"

# Copy over the source files required for the slim build:
cd "${SRCDIR}"
cp slim.ts Assert.ts "${SLIMBUILD}/"

cd "${SRCDIR}/loaders"
mkdir -p "${SLIMBUILD}/loaders"
cp Loader.ts PrecompiledLoader.ts NullLoader.ts ${SLIMBUILD}/loaders/

cd "${SRCDIR}/runtime"
mkdir -p "${SLIMBUILD}/runtime"
cp Context.ts Filters.ts Frame.ts SafeString.ts SlimEnvironment.ts SlimTemplate.ts \
	TemplateError.ts globals.ts lib.ts runtime.ts tests.ts tsGlobals.ts \
	${SLIMBUILD}/runtime/

# Compile the files:
cd "${SLIMBUILD}"
npx webpack build --config ./webpack.js

# Copy the build files into the top dist/
cd "${TOPDIR}/dist"
cp slim/nunjucks-slim.js* ./ 

