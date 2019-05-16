// static class methods for matrix operations
class Matrix {
	
	// https://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
	static Create(length) {
		
		var arr = new Array(length || 0);
		var i = length;

		if (arguments.length > 1) {
			
			var args = Array.prototype.slice.call(arguments, 1);
			
			while(i--)
				arr[length-1 - i] = this.Create.apply(this, args);
		}

		return arr;
	}
	
	// see: https://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
	static Clone(arr) {

		var i, copy;

		if (Array.isArray(arr)) {
			
			copy = arr.slice(0);
			
			for( i = 0; i < copy.length; i++ ) {
				
				copy[i] = this.Clone(copy[i]);
			}
			
			return copy;
			
		} else if (typeof arr === 'object' ) {
			
			throw 'Cannot clone array containing an object!';
			
		} else {
			
			return arr;
		}
	}
	
	static MemCopy(dst, dstoffset, src,  srcoffset, count) {
		
		for (var i = 0; i < count; i++)
			dst[dstoffset + i] = src[srcoffset + i];
	}
	
	// Copy 2D[minx + x][miny + y]
	static Copy2D(dst, src, minx, miny) {
		
		if (miny >= 0 & miny < src.length) {
			
			for (var y = 0; y < dst.length; y++) {
				
				this.MemCopy(dst[y], 0, src[y], minx, dst[0].length);
			}
		}
	}

	// Copy 2D[x][y] to 2D[minx + x][miny + y]
	static Copy2DOffset(dst, src, minx, miny) {
		
		if (miny >= 0 & miny < dst.length & src.length > 0) {
			
			for (var y = 0; y < src.length; y++) {
				
				this.MemCopy(dst[y], minx, src[y], 0, src[0].length);
			}
		}
	}
	
	// transposition
	static Transpose(src) {
		
		var srcy = src.length;
		var srcx = src[0].length;

		if (srcy > 1 && srcx > 1) {
		
			var dst = this.Create(srcx, srcy);
			
			for (var y = 0; y < srcy; y++) {
				for (var x = 0; x < srcx; x++) {
					
					dst[x][y] = src[y][x];
				}
			}
			
			return dst;
			
		} else if (srcy > 1 && srcx == 1) {
			
			var dst = this.Create(1, srcy);
			
			for (var y = 0; y < srcy; y++) {
				
				dst[y] = src[y][0];
			}
			
			return [dst];
			
		} else if (srcx > 1 && srcy == 1) {
			
			var dst = this.Create(srcx, 1);
			
			for (var x = 0; x < srcx; x++) {
				
				dst[x][0] = [src[0][x]];
			}
			
			return dst;
		}
	}
	
	// 2D matrix multiplication - naive version
	static Multiply(A, B) {
		
		var Ax = A[0].length, Ay = A.length;
		var Bx = B[0].length, By = B.length;
		
		if (Ax == By) {
			
			var result = this.Create(Ay, Bx);

			for (var y = 0; y < Ay; y++) {
				for (var x = 0; x < Bx; x++) {
					
					result[y][x] = 0;

					for (var k = 0; k < Ax; k++) {
						
						result[y][x] += A[y][k] * B[k][x];
					}
				}
			}
			
			return result;
		}
	}
	
	// element by element multiplication
	static Product(A, B) {
		
		var Ax = A[0].length, Ay = A.length;
		var Bx = B[0].length, By = B.length;
		
		if (Ax == Bx && Ay == By) {
			
			var result = this.Create(Ay, Ax);

			for (var y = 0; y < Ay; y++) {
				for (var x = 0; x < Ax; x++) {
					
					result[y][x] = Ax > 1 ? A[y][x] * B[y][x] : [A[y][x] * B[y][x]];
				}
			}
			
			return result;
		}
	}

	// element by element multiplication (vector)
	static MultiplyVector(A, B) {
		
		var Ax = A[0].length;
		var Bx = B[0].length;
		
		if (Ax == Bx) {
			
			var result = this.Create(Ax);

			for (var x = 0; x < Ax; x++) {
				
				result[x] = A[x] * B[x];
			}
			
			return result;
		}
	}

	
	// matrix * constant multiplication
	static MultiplyConstant(A, constant = 1.0) {
		
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				result[y][x] = constant * A[y][x];
			}
		}
			
		return result;
	}
	
	// matrix addition with scaling
	static Add(A, B, Scale = 1.0) {
		
		var Ax = A[0].length, Ay = A.length;
		var Bx = B[0].length, By = B.length;
		
		if (Ax == Bx && Ay == By) {
			
			var result = this.Create(Ay, Ax);

			for (var y = 0; y < Ay; y++) {
				for (var x = 0; x < Ax; x++) {
					
					result[y][x] = A[y][x] + Scale * B[y][x];
				}
			}
			
			return result;
		}
	}
	
	// matrix + constant addition
	static AddConstant(A, constant = 0.0) {
		
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				result[y][x] = A[y][x] + constant;
			}
		}
			
		return result;
	}
	
	// matrix summation
	static Sum(A) {
		
		var sum = 0.0;

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				sum += A[y][x];
			}
		}

		return sum;
	}
	
	// get sum of squares of each element
	static SquareSum(A) {
		
		var sum = 0.0;

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				sum += A[y][x] * A[y][x];
			}
		}

		return sum;
	}
	
	// mean of 2D array along a dimension
	static Mean(src, dim) {
		
		if (dim === 1) {
			
			var result = this.Create(src[0].length);
			
			for (var x = 0; x < src[0].length; x++) {
				
				var sum = 0.0;

				for (var y = 0; y < src.length; y++) {
					
					sum += src[y][x];
				}

				result[x] = sum / src.length;
			}
			
			return result;
			
		} else {
			
			var result = this.Create(src.length);

			for (var y = 0; y < src.length; y++) {
				
				var sum = 0.0;

				for (var x = 0; x < src[0].length; x++) {
					
					sum += src[y][x];
				}

				result[y] = sum / src[0].length;
			}
			
			return result;
		}
	}
	
	// sigmoid function
	static Sigmoid(x) {
		
		return 1.0 / (1.0 + Math.exp(-x));
	}
	
	// get element per element difference between arrays
	static Diff(A, B) {
		
		var Ax = A[0].length, Ay = A.length;
		var Bx = B[0].length, By = B.length;

		if (Ax == Bx && Ay == By) {
			
			var result = this.Create(Ay, Ax);
			
			for (var y = 0; y < Ay; y++) {
				for (var x = 0; x < Ax; x++) {
					
					result[y][x] = A[y][x] - B[y][x];
				}
			}
			
			return result;
		}
	}
	
	// apply sigmoid function to matrix
	static Sigm(A) {
		
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				result[y][x] = this.Sigmoid(A[y][x]);
			}
		}
			
		return result;
	}
	
	// apply delta sigmoid function to matrix
	static DSigm(A) {
		
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				var sigmoid = this.Sigmoid(A[y][x]);
				
				result[y][x] = sigmoid * (1.0 - sigmoid);
			}
		}
			
		return result;
	}
	
	// combine two arrays column-wise
	static CBind(A, B) {
		
		var Ax = A[0].length, Ay = A.length;
		var Bx = B[0].length, By = B.length;
		
		if (Ay == By) {
			
			var resultx = Ax + Bx;
			var resulty = Ay;

			var result = this.Create(resulty, resultx);

			this.Copy2DOffset(result, A, 0, 0);
			this.Copy2DOffset(result, B, Ax, 0);
		
			return result;
		}
	}
	
	// flip 3D matrix along a dimension
	static Flip(src, FlipDim) {

		var srcz = src.length;
		var srcy = src[0].length;
		var srcx = src[0][0].length;
		
		var result = this.Create(srcz, srcy, srcx);

		for (var z = 0; z < srcz; z++) {
			for (var y = 0; y < srcy; y++) {
				for (var x = 0; x < srcx; x++) {
					
					switch (FlipDim) {
						
						case 0:
						
							result[z][y][x] = src[z][y][srcx - x - 1];
							
							break;
							
						case 1:
						
							result[z][y][x] = src[z][srcy - y - 1][x];
							
							break;
							
						case 2:
						
							result[z][y][x] = src[srcz - z - 1][y][x];
							
							break;
							
						default:
						
							result[z][y][x] = src[z][y][srcx - x - 1];
							
							break;
					}
				}
			}
		}
		
		return result;
	}
	
	// flip 2D matrix along a dimension
	static Flip2D(src, FlipDim) {

		var srcy = src.length;
		var srcx = src[0].length;
		
		var result = this.Create(srcy, srcx);

		for (var y = 0; y < srcy; y++) {
			for (var x = 0; x < srcx; x++) {
				
				switch (FlipDim) {
					
					case 0:
					
						result[y][x] = src[y][srcx - x - 1];
						
						break;
						
					case 1:
					
						result[y][x] = src[srcy - y - 1][x];
						
						break;
						
					default:
					
						result[y][x] = src[y][srcx - x - 1];
						
						break;
				}
			}
		}
		
		return result;
	}
	
	// flip 3D matrix in all dimensions
	static FlipAll(src) {
		
		var srcz = src.length;
		var srcy = src[0].length;
		var srcx = src[0][0].length;
		
		var result = this.Create(srcz, srcy, srcx);
		var tmp = this.Clone(src);

		for (var FlipDim = 0; FlipDim < 3; FlipDim++) {
			
			result = this.Flip(tmp, FlipDim);
			
			tmp = this.Clone(result);
		}
		
		return result;
	}
	
	// rotate a 2D matrix
	static Rotate180(src) {
		
		var result = this.Create(src.length, src[0].length);
		var tmp = this.Clone(src);

		for (var FlipDim = 0; FlipDim < 2; FlipDim++) {
			
			result = this.Flip2D(tmp, FlipDim);
			
			tmp = this.Clone(result);
		}

		return result;
	}
	
	// expand a matrix A[x][y] by [ex][ey]
	static Expand(A, expandx, expandy) {
		
		var outputx = A[0].length * expandx;
		var outputy = A.length * expandy;

		var output = this.Create(outputy, outputx);

		for (var y = 0; y < A.length; y++) {
			for (var x = 0; x < A[0].length; x++) {
				for (var SZy = 0; SZy < expandy; SZy++) {
					for (var SZx = 0; SZx < expandx; SZx++) {
						
						output[y * expandy + SZy][x * expandx + SZx] = A[y][x];
					}
				}
			}
		}
		
		return output;
	}
	
	// Transforms x into a column vector
	static Vector(x) {
		
		var temp = this.Transpose(x);

		var result = this.Create(x.length * x[0].length);
		
		var i = 0;
		
		for (var y = 0; y < temp.length; y++) {
			for (var x = 0; x < temp[0].length; x++) {
				
				result[i] = temp[y][x];
				
				i++;
			}
		}
		
		return result;
	}

	// get sum of elements per row
	static RowSums(A) {
		
		var result = this.Create(A.length);

		for (var i = 0; i < A.length; i++) {
			
			result[i] = 0.0;

			for (var j = 0; j < A[0].length; j++) {
				
				result[i] += A[i][j];
			}
		}

		return result;
	}
	
	// get sum of elements per column
	static ColSums(A) {
		
		var result = this.Create(A[0].length);

		for (var j = 0; j < A[0].length; j++) {
			
			result[j] = 0.0;

			for (var i = 0; i < A.length; i++) {
				
				result[j] += A[i][j];
			}
		}

		return result;
	}
	
	// create a 2D diagonal/identity matrix of size [dim][dim]
	static Diag(dim) {
		
		if (dim > 0) {
			
			var result = this.Create(dim, dim);

			for (var y = 0; y < dim; y++) {
				for (var x = 0; x < dim; x++) {
					
					result[y][x] = (x == y) ? 1 : 0;
				}
			}

			return result;
		}
	}
	
	// compute the square root of each element in the 2D array
	static Sqrt(A) {
		
		var Ax = A[0].length, Ay = A.length;

		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				result[y][x] = Math.sqrt(A[y][x]);
			}
		}
			
		return result;	
	}
	
	static Pow(A, power) {

		var Ax = A[0].length, Ay = A.length;

		var result = this.Create(Ay, Ax);

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				result[y][x] = Math.pow(A[y][x], power);
			}
		}
			
		return result;
	}

	static Powers(A, powers) {
		
		var px = powers[0].length, py = powers.length;

		var result = this.Create(py, px);

		for (var y = 0; y < py; y++) {
			for (var x = 0; x < px; x++) {
				
				result[y][x] = Math.pow(A, powers[y][x]);
			}
		}

		return result;
	}
		
	static Set(A, value = 0.0) {
		
		var Ax = A[0].length, Ay = A.length;

		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				A[y][x] = value;
			}
		}
	}
	
	static Normalize(A) {
			
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);
		var maxvals = this.Create(Ax);
		var minvals = this.Create(Ax);
		
		for (var x = 0; x < Ax; x++) {
		
			maxvals[x] = Number.MIN_VALUE;
			minvals[x] = Number.MAX_VALUE;
		}
		
		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				maxvals[x] = Math.max(A[y][x], maxvals[x]);
				minvals[x] = Math.min(A[y][x], minvals[x]);
			}
		}
		
		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				var denum = maxvals[x] - minvals[x];
				
				result[y][x] = (A[y][x] - minvals[x])/denum;
			}
		}
		
		return { result: result, min: minvals, max: maxvals };
	}
	
	static ApplyNormalization(A, maxvals, minvals) {
		
		var Ax = A[0].length, Ay = A.length;
		
		var result = this.Create(Ay, Ax);
		
		for (var y = 0; y < Ay; y++) {
			for (var x = 0; x < Ax; x++) {
				
				var denum = maxvals[x] - minvals[x];
				
				result[y][x] = (A[y][x] - minvals[x])/denum;
			}
		}
		
		return result;
	}
};

// see: https://stackoverflow.com/questions/28445693/how-do-i-make-a-public-static-field-in-an-es6-class
class ModelParameters
{
	static get X() {

		return 0;
	}
		
	static get Y() {

		return 1;
	}
	
	static get ALPHA() {

		return 2;
	}
	
	static get W() {

		return 3;
	}

	static get B() {

		return 4;
	}
};

// see: https://stackoverflow.com/questions/28445693/how-do-i-make-a-public-static-field-in-an-es6-class
class KernelType
{
	static get POLYNOMIAL() { 
		
		return 0; 
	}
	
	static get GAUSSIAN() {
		
		return 1;
	}
	
	static get RADIAL() {
	
		return 2;
	}
	
	static get SIGMOID() {
		
		return 3;
	}
	
	static get LINEAR() {
		
		return 4;
	}
	
	static get FOURIER() {
		
		return 5;
	}
	
	static get UNKNOWN() {
		
		return -1;
	}
};

class KernelFunction {

	static Rows(x) {
		
		return x.length;
	}

	static Cols(x) {

		return x[0].length;
	}

	static Vectorize(x1, x2) {

		// Reshape into column vectors
		x1 = Matrix.Vector(x1);
		x2 = Matrix.Vector(x2);
	}

	static Multiply(x1, x2) {

		this.Vectorize(x1, x2);

		var x = 0.0;

		if (x1.length == x2.length) {
			
			for (var i = 0; i < x1.length; i++)
				x += x1[i] * x2[i];
		}

		return x;
	}

	static SquaredDiff(x1, x2) {

		this.Vectorize(x1, x2);
		
		var x = 0.0;

		if (x1.length == x2.length) {
			
			for (var i = 0; i < x1.length; i++) {

				var d = x1[i] - x2[i];
	
				x += d * d;
			}
		}

		return x;
	}

	static Linear(x1, x2, k) {

		var x = this.Multiply(x1, x2);
		var m = k.length > 0 ? k[0] : 1.0;
		var b = k.length > 1 ? k[1] : 0.0;

		return x * m + b;
	}

	static Polynomial(x1, x2, k) {

		var b = k.length > 0 ? k[0] : 0.0;
		var a = k.length > 1 ? k[1] : 1.0;

		return Math.pow(this.Multiply(x1, x2) + b, a);
	}

	static Gaussian(x1, x2, k) {

		var x = this.SquaredDiff(x1, x2);
		var sigma = k.length > 0 ? k[0] : 1.0;
		var denum = 2.0 * sigma * sigma;

		return Math.abs(denum) > 0 ? Math.exp(-x / denum) : 0.0;
	}

	static Radial(x1, x2, k) {

		var sigma = k.length > 0 ? k[0] : 1.0;
		var denum = 2.0 * sigma * sigma;

		return Math.abs(denum) > 0.0 ? Math.exp(-Math.sqrt(this.SquaredDiff(x1, x2)) / denum) : 0.0;
	}

	static Sigmoid(x1, x2, k) {

		var m = k.length > 0 ? k[0] : 1.0;
		var b = k.length > 1 ? k[1] : 0.0;

		return Math.tanh(m * this.Multiply(x1, x2) / x1.length + b);
	}

	static Fourier(x1, x2, k) {

		this.Vectorize(x1, x2);

		var z = Matrix.Create(x1.length);
		var prod = 0.0;
		var m = k.length > 0 ? k[0] : 1.0;

		for (var i = 0; i < x1.length; i++) {

			z[i] = Math.sin(m + 0.5) * 2.0;

			var d = x1[i] - x2[i];

			z[i] = Math.abs(d) > 0.0 ? Math.sin(m + 0.5) * d / Math.sin(d * 0.5) : z[i];

			prod = (i == 0) ? z[i] : prod * z[i];
		}

		return prod;
	}

	static Run(type, x1, x2, k) {

		var result = 0.0;

		if (type == KernelType.LINEAR) {

			result = this.Linear(x1, x2, k);

		} else if (type == KernelType.GAUSSIAN) {

			result = this.Gaussian(x1, x2, k);
		
		} else  if (type == KernelType.FOURIER) {

			result = this.Fourier(x1, x2, k);
		
		} else if (type == KernelType.SIGMOID) {

			result = this.Sigmoid(x1, x2, k);
		
		} else if (type == KernelType.RADIAL) {

			result = this.Radial(x1, x2, k);
		
		} else if (type == KernelType.POLYNOMIAL) {

			result = this.Polynomial(x1, x2, k);
		}

		return result;
	}
};

class SupportVectorMachine {

	constructor() {
		
		this.ModelX = [];
        this.ModelY = [];
        this.Type = KernelType.UNKNOWN;
        this.KernelParam = [];
        this.Alpha = [];
        this.W = [];
        this.B = 0.0;
        this.C = 0.0;
        this.Tolerance = 0.0;
        this.Category = 0;
        this.Passes = 0;
        this.Iterations = 0;
        this.MaxIterations = 0;
        this.Trained = false;

        // Internal variables
        this.K = [];
        this.E = [];
        this.alpha = [];
        this.dx = [];
        this.dy = [];
        this.kparam = [];
        this.b = 0.0;
        this.eta = 0.0;
        this.H = 0.0;
        this.L = 0.0;
        this.ktype = KernelType.UNKNOWN;
	}

	Model(x, y, type, kernelParam, alpha, b, w, passes) 
	{
		this.ModelX = x;
		this.ModelY = y;
		this.Type = type;
		this.KernelParam = kernelParam;
		this.Alpha = alpha;
		this.B = b;
		this.W = w;
		this.Passes = passes;
		this.Trained = true;
	}

	Rows(x) {

		return x[0].length;
	}

	Cols(x) {

		return x.lengt;
	}

	Setup(x, y, c, kernel, param, tolerance = 0.001, maxpasses = 5, category = 1) {
		
		this.dx = Matrix.Clone(x);
		this.dy = Matrix.Clone(y);
		
		this.ktype = kernel;
		
		// Data parameters
		var m = this.Rows(dx);

		this.Category = category;
		this.MaxIterations = maxpasses;
		this.Tolerance = tolerance;
		this.C = c;

		// Reset internal variables
		this.kparam = param;

		// Variables
		this.alpha = Matrix.Create(m);
		this.E = Matrix.Create(m);
		this.b = 0;
		this.Iterations = 0;

		// Pre-compute the Kernel Matrix since our dataset is small
		// (In practice, optimized SVM packages that handle large datasets
		// gracefully will *not* do this)
		if (kernel == KernelType.LINEAR) {

			var tinput = Matrix.Transpose(dx);

			this.K = Matrix.Multiply(dx, tinput);

			var slope = kparam.length > 0 ? kparam[0] : 1.0;
			var inter = kparam.length > 1 ? kparam[1] : 0.0;

			this.K = Matrix.MultiplyConstant(this.K, slope);
			this.K = Matrix.AddConstant(this.K, inter);
				
		} else if (kernel == KernelType.GAUSSIAN || kernel == KernelType.RADIAL) {
			
			// RBF Kernel
			// This is equivalent to computing the kernel on every pair of examples

			var pX2 = Matrix.Pow(this.dx, 2.0);
			var rX2 = Matrix.RowSums(pX2);
			var tX2 = Matrix.Transpose(rX2);
			var trX = Matrix.Transpose(this.dx);

			var temp2 = Matrix.Multiply(this.dx, trX);
			var tempK = Matrix.Expand(rX2, m, 1);
			var temp1 = Matrix.Expand(tX2, 1, m);

			temp2 = Matrix.MultiplyConstant(temp2, -2.0);
			tempK = Matrix.Add(tempK, temp1);
			tempK = Matrix.Add(tempK, temp2);

			var sigma = kparam.length > 0 ? kparam[0] : 1.0;

			var g = Math.abs(sigma) > 0.0 ? Math.exp(-1.0 / (2.0 * sigma * sigma)) : 0.0;

			if (this.Type == KernelType.RADIAL) {

				tempK = Matrix.Sqrt(tempK);
			}

			this.K = Matrix.Powers(g, tempK);
				
		} else {

			this.K = Matrix.Create(m, m);
			var Xi = Matrix.Create(1, this.Cols(this.dx));
			var Xj = Matrix.Create(1, this.Cols(this.dx));

			for (var i = 0; i < m; i++) {

				Matrix.Copy2D(Xi, dx, 0, i);

				for (var j = 0; j < m; j++) {

					Matrix.Copy2D(Xj, dx, 0, j);

					K[i][j] = KernelFunction.Run(kernel, Xi, Xj, kparam);

					// the matrix is symmetric
					this.K[j][i] = this.K[i][j];
				}
			}
		}

		this.eta = 0.0;
		this.L = 0;
		this.H = 0;

		// Map 0 (or other categories) to -1
		for (var i = 0; i < dy.length; i++) {

			this.dy[i] = parseInt(this.dy[i]) != this.Category ? -1 : 1;
		}
	}

	Step() {
		
		if (this.Iterations >= this.MaxIterations)
			return true;

		// Data parameters
		var m = dy.length;

		var num_changed_alphas = 0;

		for (var i = 0; i < m; i++) {

			// Calculate Ei = f(x(i)) - y(i) using (2).
			this.E[i] = this.b;

			for (var yy = 0; yy < m; yy++) {

				this.E[i] += this.alpha[yy] * this.dy[yy] * this.K[i][yy];
			}

			this.E[i] -= this.dy[i];

			if ((this.dy[i] * this.E[i] < -this.Tolerance && this.alpha[i] < this.C) || (this.dy[i] * this.E[i] > this.Tolerance && this.alpha[i] > 0.0)) {

				// In practice, there are many heuristics one can use to select
				// the i and j. In this simplified code, we select them randomly.
				var j = i;

				while (j == i) {

					// Make sure i != j
					j = parseInt(Math.floor(m * Math.random()));
				}

				// Calculate Ej = f(x(j)) - y(j) using (2).
				this.E[j] = this.b;

				for (var yy = 0; yy < m; yy++) {

					this.E[j] += this.alpha[yy] * this.dy[yy] * K[j][yy];
				}

				this.E[j] -= this.dy[j];

				// Save old alphas
				var alpha_i_old = this.alpha[i];
				var alpha_j_old = this.alpha[j];

				// Compute L and H by (10) or (11). 
				if (parseInt(this.dy[i]) == parseInt(this.dy[j])) {

					this.L = Math.max(0.0, this.alpha[j] + this.alpha[i] - this.C);
					this.H = Math.min(this.C, this.alpha[j] + this.alpha[i]);
				
				} else {

					this.L = Math.max(0.0, this.alpha[j] - this.alpha[i]);
					this.H = Math.min(this.C, this.C + this.alpha[j] - this.alpha[i]);
				}

				if (Math.abs(this.L - this.H) <= Number.EPSILON) {

					// continue to next i 
					continue;
				}

				// Compute eta by (14).
				this.eta = 2.0 * this.K[i][j] - this.K[i][i] - this.K[j][j];

				if (this.eta >= 0.0) {

					// continue to next i. 
					continue;
				}

				// Compute and clip new value for alpha j using (12) and (15).
				this.alpha[j] = this.alpha[j] - (this.dy[j] * (this.E[i] - this.E[j])) / this.eta;

				// Clip
				this.alpha[j] = Math.min(this.H, this.alpha[j]);
				this.alpha[j] = Math.max(this.L, this.alpha[j]);

				// Check if change in alpha is significant
				if (Math.abs(this.alpha[j] - this.alpha_j_old) < this.Tolerance) {

					// continue to next i. 
					// replace anyway
					this.alpha[j] = this.alpha_j_old;

					continue;
				}

				// Determine value for alpha i using (16). 
				this.alpha[i] = this.alpha[i] + this.dy[i] * this.dy[j] * (this.alpha_j_old - this.alpha[j]);

				// Compute b1 and b2 using (17) and (18) respectively. 
				var b1 = this.b - this.E[i] - this.dy[i] * (this.alpha[i] - this.alpha_i_old) * this.K[i][j] - this.dy[j] * (this.alpha[j] - this.alpha_j_old) * this.K[i][j];
				var b2 = this.b - this.E[j] - this.dy[i] * (this.alpha[i] - this.alpha_i_old) * this.K[i][j] - this.dy[j] * (this.alpha[j] - this.alpha_j_old) * this.K[j][j];

				// Compute b by (19). 
				if (0.0 < this.alpha[i] && this.alpha[i] < this.C) {

					b = b1;
				
				} else if (0.0 < this.alpha[j] && this.alpha[j] < this.C) {

					this.b = b2;
				
				} else {

					this.b = (b1 + b2) / 2;
				}

				num_changed_alphas++;
			}
		}

		if (num_changed_alphas == 0) {

			this.Iterations++;

		} else {
			
			this.Iterations = 0;
		}

		return this.Iterations >= this.MaxIterations;
	}

	Generate() {
		
		var m = this.Rows(dx);
		var n = this.Cols(dx);

		var idx = 0;

		for (var i = 0; i < m; i++) {

			if (Math.abs(this.alpha[i]) > 0.0) {

				idx++;
			}
		}

		this.ModelX = Matrix.Create(idx, this.Cols(dx));
		this.ModelY = Matrix.Create(idx);
		this.Alpha = Matrix.Create(idx);
		this.KernelParam = Matrix.Clone(this.kparam);

		var ii = 0;

		for (var i = 0; i < m; i++) {

			if (Math.abs(this.alpha[i]) > 0.0) {

				for (var j = 0; j < n; j++) {

					this.ModelX[ii][j] = this.dx[i][j];
				}

				this.ModelY[ii] = this.dy[i];

				this.Alpha[ii] = this.alpha[i];

				ii++;
			}
		}

		this.B = this.b;
		this.Passes = this.Iterations;
		this.Type = this.ktype;

		var axy = Matrix.MultiplyVector(alpha, dy);
		var tay = Matrix.Transpose(axy);
		var txx = Matrix.Multiply(tay, dx);

		this.W = Matrix.Transpose(txx);

		this.Trained = true;
	}

	// SVMTRAIN Trains an SVM classifier using a simplified version of the SMO 
	// algorithm.
	//
	// [model] = svm_train(X, Y, C, kernelFunction, kernelParam, tol, max_passes) trains an
	// SVM classifier and returns trained model. X is the matrix of training 
	// examples.  Each row is a training example, and the jth column holds the 
	// jth feature.  Y is a column matrix containing 1 for positive examples 
	// and 0 for negative examples.  C is the standard SVM regularization 
	// parameter.  tol is a tolerance value used for determining equality of 
	// floating point numbers. max_passes controls the number of iterations
	// over the dataset (without changes to alpha) before the algorithm quits.
	//
	// Note: This is a simplified version of the SMO algorithm for training
	// SVMs. In practice, if you want to train an SVM classifier, we
	// recommend using an optimized package such as:  
	//
	// LIBSVM   (http://www.csie.ntu.edu.tw/~cjlin/libsvm/)
	// SVMLight (http://svmlight.joachims.org/)
	//
	// Converted to R by: SD Separa (2016/03/18)
	// Converted to C# by: SD Separa (2018/09/29)
	//
	// Converted to JavaScript by: SD Separa (2019/05/16)
	Train(x, y, c, kernel, param, tolerance = 0.001, maxpasses = 5, category = 1) {

		this.Setup(x, y, c, kernel, param, tolerance, maxpasses, category);

		// Train
		while (!this.Step()) { }

		this.Generate();
	}

	// SVMPREDICT returns a vector of predictions using a trained SVM model
	//(svm_train). 
	//
	// pred = SVMPREDICT(model, X) returns a vector of predictions using a 
	// trained SVM model (svm_train). X is a mxn matrix where there each 
	// example is a row. model is a svm model returned from svm_train.
	// predictions pred is a m x 1 column of predictions of {0, 1} values.
	//
	// Converted to R by: SD Separa (2016/03/18)
	// Converted to C# by: SD Separa (2018/09/29)
	//
	// Converted to JavaScript by: SD Separa (2019/05/16)
	Predict(input) {
		
		var predictions = Matrix.Create(this.Rows(input), 1);

		if (this.Trained) {

			var x = [];

			if (this.Cols(input) == 1) {

				x = Matrix.Transpose(input);

			} else {

				Matrix.Copy2D(x, input, 0, 0);
			}

			var m = this.Rows(x);

			predictions = Matrix.Create(m, 1);

			if (this.Type == KernelType.LINEAR) {

				predictions = Matrix.Multiply(x, this.W);
				predictions = Matrix.AddConstant(predictions, this.B);

			} else if (this.Type == KernelType.GAUSSIAN || this.Type == KernelType.RADIAL) {
				
				// RBF Kernel
				// This is equivalent to computing the kernel on every pair of examples
				var pX1 = Matrix.Pow(x, 2);
				var pX2 = Matrix.Pow(this.ModelX, 2);
				var rX2 = Matrix.RowSums(pX2);

				var X1 = Matrix.RowSums(pX1);
				var X2 = Matrix.Transpose(rX2);
				var tX = Matrix.Transpose(ModelX);
				var tY = Matrix.Transpose(ModelY);
				var tA = Matrix.Transpose(Alpha);

				var rows = this.Rows(X1);
				var cols = this.Cols(X2);

				var tempK = Matrix.Create(rows, cols);
				var temp1 = Matrix.Create(cols, rows);
				var temp2 = Matrix.Multiply(x, tX);

				temp2 = Matrix.MultiplyConstant(temp2, -2);
				tempK = Matrix.Expand(X1, cols, 1);
				temp1 = Matrix.Expand(X2, 1, rows);

				tempK = Matrix.Add(tempK, temp1);
				tempK = Matrix.Add(tempK, temp2);

				var sigma = this.KernelParam.length > 0 ? this.KernelParam[0] : 1.0;

				if (this.Type == KernelType.RADIAL) {
					
					tempK = Matrix.Sqrt(tempK);
				}

				var g = Math.abs(sigma) > 0 ? Math.exp(-1 / (2 * sigma * sigma)) : 0.0;

				var Kernel = Matrix.Powers(g, tempK);

				var tempY = Matrix.Create(rows, this.Cols(tY));
				var tempA = Matrix.Create(rows, this.Cols(tA));

				tempY = Matrix.Expand(tY, 1, rows);
				tempA = Matrix.Expand(tA, 1, rows);

				Kernel = Matrix.Product(Kernel, tempY);
				Kernel = Matrix.Product(Kernel, tempA);

				var p = Matrix.RowSums(Kernel);

				Matrix.Copy2D(predictions, p, 0, 0);
				predictions = Matrix.AddConstant(predictions, this.B);
			
			} else {

				var Xi = Matrix.Create(this.Cols(x));
				var Xj = Matrix.Create(this.Cols(ModelX));

				for (var i = 0; i < m; i++) {

					var prediction = 0;

					Matrix.Copy2D(Xi, x, 0, i);

					for (var j = 0; j < this.Rows(ModelX); j++) {

						Matrix.Copy2D(Xj, ModelX, 0, j);

						prediction += this.Alpha[j] * this.ModelY[j] * KernelFunction.Run(this.Type, Xi, Xj, this.KernelParam);
					}

					predictions[i][0] += prediction + this.B;
				}
			}
		}

		return predictions;
	}

	Classify(input, threshold = 0.0) {
		
		var classification = Matrix.Create(this.RowsRows(input), 1);
		
		var predictions = this.Predict(input);

		for (var i = 0; i < predictions.length; i++) {

			classification[i][0] = predictions[i][0] > threshold ? this.Category : 0;
		}

		return classification;
	}

	Test(output, classification, category = 1) {
		
		var errors = 0;

		for (var i = 0; i < classification.length; i++) {

			var correct = parseInt(output[i]) != category ? 0 : category;

			errors += correct != classification[i][0] ? 1 : 0;
		}

		return errors;
	}
};
