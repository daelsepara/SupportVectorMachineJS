angular.module('d3', []).factory('d3Service', [function(){ return d3; }]);
  
angular
	.module('DeepLearning', ['ngWebworker', 'ngFileSaver', 'd3'])
	.controller('SupportVectorMachineController', ['$scope', 'Webworker', 'FileSaver', 'Blob', function($scope, Webworker, FileSaver, Blob) {
		
		class ModelParameters {

			constructor(id, type, parameters, regularization, passes, tolerance, category) {

				this.index = id;
				this.Type = type;
				this.KernelParam = parameters;
				this.C = regularization;
				this.MaxIterations = passes;
				this.Tolerance = tolerance;
				this.Category = category;
			}
		}

		$scope.Models = [];
		$scope.Normalization = [];
		$scope.Classification = [];
		$scope.Prediction = [];

		$scope.TrainingData = [];
		$scope.Output = [];
		$scope.Inputs = 0;
		$scope.Categories = 0;
		$scope.Items = 0;

		$scope.Training = false;
		$scope.TrainingProgress = 0;
		$scope.Threshold = 0.9;
		$scope.ClassifierProgress = 0;
		$scope.asyncTrainer = undefined;
		$scope.asyncClassifier = undefined;
		$scope.asyncPlotter = undefined;

		$scope.SelectedFile = {};
		$scope.TestFile = {};
		$scope.NetworkFile = {};
		
		$scope.TestData = [];
		$scope.Samples = 0;

		$scope.DelimiterNames = ["Tab \\t", "Comma ,", "Space \\s", "Vertical Pipe |", "Colon :", "Semi-Colon ;", "Forward Slash /", '/', "Backward Slash \\"];
		$scope.Delimiters = ['\t', ',', ' ', '|', ':', ';', '/', '\\'];
		$scope.delimiter = $scope.DelimiterNames[0];
		$scope.SelectedDelimiter = 0;

		$scope.KernelType = {Polynomial: 0, Gaussian: 1, Radial: 2, Sigmoid: 3, Linear: 4, Fourier: 5};
		
		$scope.KernelNames = ["Polynomial", "Gaussian", "Radial", "Sigmoid", "Linear", "Fourier"];
		$scope.kernel = $scope.KernelNames[0];
		$scope.SelectedKernel = 0;

		$scope.bias = 0.0;
		$scope.exponent = 2.0;
		$scope.sigma = 0.01000;
		$scope.slope = 1.0;
		$scope.intercept = 0.0;
		$scope.scalingFactor = 1.0;
		$scope.category = 0;
		$scope.regularization = 1;
		$scope.passes = 5;
		$scope.tolerance = 0.00001;

		$scope.SelectedModel = 0;

		$scope.PlotWidth = 1024;
		$scope.PlotHeight = 1024;
		$scope.plotContours = false;
		
		$scope.SelectDelimiter = function() {
			
			var i = $scope.DelimiterNames.indexOf($scope.delimiter);
			
			$scope.SelectedDelimiter = i + 1;
		}

		$scope.SelectKernel = function() {
			
			var i = $scope.KernelNames.indexOf($scope.kernel);
			
			$scope.SelectedKernel = i;
		}

		$scope.ReadTrainingData = function() {
			
			$scope.TrainingData = [];
			$scope.Output = [];
			$scope.Items = 0;
			$scope.Categories = 0;
			$scope.Inputs = 0;
			
			var reader = new FileReader();

			reader.onload = function(event) {

				$scope.$apply(function() {
					
					var lines = reader.result.split('\n');
					
					var delimiter = $scope.SelectedDelimiter > 0 ? $scope.Delimiters[$scope.SelectedDelimiter - 1] : "\t";
					
					for (var line = 0; line < lines.length; line++) {

						var tmp = [];

						var tokens = lines[line].trim().split(delimiter);

						if (tokens.length > 0) {
							
							if (line == 0 && tokens.length > 1) {
								
								$scope.Inputs = tokens.length - 1;
							}
							
							if (tokens.length > 1) {
								
								var item = parseInt(tokens[tokens.length - 1]);
								
								$scope.Categories = Math.max($scope.Categories, item);
								
								$scope.Output.push([item]);
							}
								
							for (var i = 0; i < tokens.length - 1; i++) {
								
								tmp.push(parseFloat(tokens[i]));
							}
							
							if (tmp.length > 0) {
								
								$scope.TrainingData.push(tmp);
								
								$scope.Items++;
							}
						}
					}
					
					$scope.fileContent = reader.result.trim();
				});
			}

			if ($scope.SelectedFile.name != undefined) {
				
				reader.readAsText($scope.SelectedFile);
			}
		}

		$scope.ReadTestData = function() {
			
			$scope.TestData = [];
			$scope.Samples = 0;
			
			var reader = new FileReader();

			reader.onload = function(progressEvent) {

				$scope.$apply(function() {
					
					var lines = reader.result.split('\n');
					
					var delimiter = $scope.SelectedDelimiter > 0 ? $scope.Delimiters[$scope.SelectedDelimiter - 1] : "\t";
					
					for (var line = 0; line < lines.length; line++) {

						var tmp = [];

						var tokens = lines[line].trim().split(delimiter);

						if (tokens.length >= $scope.Inputs) {
							
							for (var i = 0; i < tokens.length; i++) {
								
								if (i >= 0 && i < $scope.Inputs)
									tmp.push(parseFloat(tokens[i]));
							}
							
							if (tmp.length > 0) {
								
								$scope.TestData.push(tmp);
								
								$scope.Samples++;
							}
						}
					}
					
					$scope.testContent = reader.result.trim();
					
				});
			}

			if ($scope.TestFile.name != undefined) {
				
				reader.readAsText($scope.TestFile);
			}
		}

		// re-number index numbers (after deletion)
		$scope.RenumberModels = function() {

			for (var i = 0; i < $scope.Models.length; i++) {
					
				$scope.Models[i].index = i + 1;
			}
		}

		// add model
		$scope.AddModel = function() {

			if ($scope.category != 0) {

				var found = $scope.Models.findIndex(element => element.Category == $scope.category);

				// Add only if model for a specific category has not yet been defined
				if (found < 0) {

					var model = undefined;

					if ($scope.SelectedKernel == $scope.KernelType.Polynomial) {

						var model = new ModelParameters($scope.Models.length + 1, $scope.KernelType.Polynomial, [$scope.bias, $scope.exponent], $scope.regularization, $scope.passes, $scope.tolerance, $scope.category);
					
					} else if ($scope.SelectedKernel == $scope.KernelType.Gaussian || $scope.SelectedKernel == $scope.KernelType.Radial) {

						var model = new ModelParameters($scope.Models.length + 1, $scope.SelectedKernel == $scope.KernelType.Gaussian ? $scope.KernelType.Gaussian : $scope.KernelType.Radial, [$scope.sigma], $scope.regularization, $scope.passes, $scope.tolerance, $scope.category);

					} else if ($scope.SelectedKernel == $scope.KernelType.Sigmoid || $scope.SelectedKernel == $scope.KernelType.Linear) {

						var model = new ModelParameters($scope.Models.length + 1, $scope.SelectedKernel == $scope.KernelType.Sigmoid ? $scope.KernelType.Sigmoid : $scope.KernelType.Linear, [$scope.slope, $scope.intercept], $scope.regularization, $scope.passes, $scope.tolerance, $scope.category);

					} else if ($scope.SelectedKernel == $scope.KernelType.Fourier) {

						var model = new ModelParameters($scope.Models.length + 1, $scope.KernelType.Fourier, [$scope.scalingFactor], $scope.regularization, $scope.passes, $scope.tolerance, $scope.category);
					}

					if (model != undefined) {
						
						$scope.Models.push(model);
					}
				}
			}
		}

		// copy model parameters
		$scope.SelectModel = function() {

			if ($scope.SelectedModel > 0 && $scope.SelectedModel <= $scope.Models.length) {

				var current = $scope.Models[$scope.SelectedModel - 1];

				$scope.kernel = $scope.KernelNames[current.Type];
				$scope.SelectedKernel = current.Type;

				if (current.Type == $scope.KernelType.Polynomial) {
				
					$scope.bias = current.KernelParam[0];
					$scope.exponent = current.KernelParam[1];
				
				} else if (current.Type == $scope.KernelType.Gaussian || current.Type == $scope.KernelType.Radial) {

					$scope.sigma = current.KernelParam[0];

				} else if (current.Type == $scope.KernelType.Sigmoid || current.Type == $scope.KernelType.Linear) {
				
					$scope.slope = current.KernelParam[0];
					$scope.intercept = current.KernelParam[1];

				} else if (current.Type == $scope.KernelType.Fourier) {
				
					$scope.scalingFactor = current.KernelParam[0];
				}

				$scope.passes = current.MaxIterations;
				$scope.regularization = current.C;
				$scope.tolerance = current.Tolerance; 				
				$scope.category = current.Category;
			}
		}

		// remove model from list
		$scope.RemoveModel = function() {

			if ($scope.SelectedModel > 0 && $scope.SelectedModel <= $scope.Models.length) {

				for (var i = 0; i < $scope.Models.length; i++) {
					
					if ($scope.Models[i].index == $scope.SelectedModel) {
						
						$scope.Models.splice(i, 1);

						break;
					}
				}

				$scope.RenumberModels();

				$scope.SelectedModel = 0;
			}
		}

		$scope.UpdateModel = function() {

			var current = $scope.SelectedModel - 1;

			if (current >= 0 && current < $scope.Models.length) {

				$scope.Models[current].Type = $scope.SelectedKernel;

				if ($scope.SelectedKernel == $scope.KernelType.Polynomial) {

					$scope.Models[current].KernelParam = [$scope.bias, $scope.exponent];
				
				} else if ($scope.SelectedKernel == $scope.KernelType.Gaussian || $scope.SelectedKernel == $scope.KernelType.Radial) {

					$scope.Models[current].KernelParam = [$scope.sigma];

				} else if ($scope.SelectedKernel == $scope.KernelType.Sigmoid || $scope.SelectedKernel == $scope.KernelType.Linear) {

					$scope.Models[current].KernelParam = [$scope.slope, $scope.intercept];

				} else if ($scope.SelectedKernel == $scope.KernelType.Fourier) {

					$scope.Models[current].KernelParam = [$scope.scalingFactor];
				}

				$scope.Models[current].MaxIterations = $scope.passes;
				$scope.Models[current].C = $scope.regularization;
				$scope.Models[current].Tolerance = $scope.tolerance; 				
				$scope.Models[current].Category = $scope.category;
			}
		}

		$scope.StopAsyncTrainer = function() {

			if ($scope.asyncTrainer) {
				
				try {
					
					$scope.asyncTrainer.terminate();
		
					$scope.asyncTrainer  = null;
					
					$scope.Training = false;
					
					$scope.TrainingProgress = 0.0;
					
				} catch (err) {
					
					$scope.asyncTrainer = null;
					
					$scope.Training = false;
					
					$scope.TrainingProgress = 0.0;
				}
			}
		}
		
		$scope.StopAsyncClassifier = function() {

			if ($scope.asyncClassifier) {
				
				try {
					
					$scope.asyncClassifier.terminate();
		
					$scope.asyncClassifier  = null;
					
					$scope.ClassifierProgress = 0.0;
					
				} catch (err) {
					
					$scope.asyncClassifier = null;
					
					$scope.ClassifierProgress = 0.0;
				}
			}
		}

		$scope.AsyncTrainer = function() {

			// function that will become a worker
			function async(currentPath, input, output, models) {
			
				importScripts(currentPath + "js/Models.js");

				var svms = [];

				var temp = new SupportVectorMachine();

				var resultNormalization = Matrix.Normalize(input);
				var normalization = [resultNormalization.min, resultNormalization.max];

				for (var i = 0; i < models.length; i++) {
					
					var model = models[i]; 
					
					var machine = new SupportVectorMachine();

					machine.Setup(input, output, model.C, model.Type, model.KernelParam, model.Tolerance, model.MaxIterations, model.Category);

					svms.push(machine);
				}

				var done = svms.length > 0 ? false : true;

				while (!done) {
					
					done = true;

					var MaxIterations = 0;
					var Iterations = 0;

					for (var i = 0; i < svms.length; i++) {

						var result = svms[i].Step();

						MaxIterations += svms[i].MaxIterations;
						Iterations += svms[i].Iterations;

						if (result && !svms[i].Trained) {

                        	svms[i].Generate();
                    	}

						done &= result;
					}

					notify({Iterations: Iterations, MaxIterations: MaxIterations});
				}

				for (var i = 0; i < svms.length; i++) {

					svms[i].index = i + 1;
				}
				
				complete({models: svms, normalization: normalization});
			}

			if (!$scope.Training && $scope.Models.length > 0 && $scope.TrainingData.length > 0 && $scope.Output.length > 0) {
					
				var currentPath = document.URL;
				
				$scope.Training = true;
				
				// mark this worker as one that supports async notifications
				$scope.asyncTrainer = Webworker.create(async, { async: true });

				// uses the native $q style notification: https://docs.angularjs.org/api/ng/service/$q
				$scope.asyncTrainer.run(currentPath, $scope.TrainingData, $scope.Output, $scope.Models).then(function(result) {
					
					// promise is resolved.

					$scope.Models = result.models;
					$scope.Normalization = result.normalization;
					$scope.TrainingProgress = 1.0;
					$scope.Training = false;
					$scope.SelectedModel = 0;

				}, null, function(result) {
					
					// promise has a notification

					$scope.TrainingProgress = result.Iterations / result.MaxIterations;
					
				}).catch(function(oError) {
					
					$scope.asyncTrainer = null;
				});
			}
		}

		$scope.AsyncClassifier = function() {
			
			// function that will become a worker
			function async(currentPath, input, models, selected, threshold) {

				importScripts(currentPath + "js/Models.js");

				var classification = Matrix.Create(input.length, 1);
				Matrix.Set(classification, 0);

				var prediction = Matrix.Create(input.length, 1);
				Matrix.Set(prediction, 0);

				if (selected != 0) {

					var current = selected - 1;

					if (models[current].Trained) {

						var machine = new SupportVectorMachine();
						
						machine.Initialize(
							models[current].ModelX,
							models[current].ModelY,
							models[current].Type,
							models[current].KernelParam,
							models[current].Alpha,
							models[current].B,
							models[current].W,
							models[current].MaxIterations,
							models[current].C,
							models[current].Category
						);
						
						for (var item = 0; item < input.length; item += 100) {

							var p = machine.Predict(input.slice(item, item + 100));

							for (var y = 0; y < p.length; y++) {

								if (p[y][0] > prediction[item + y][0]) {

									prediction[item + y][0] = p[y][0];

									classification[item + y][0] = p[y][0] >= threshold ? machine.Category : 0;
								}
							}

							var ClassifierProgress = item/input.length;
							
							notify({ClassifierProgress: ClassifierProgress});
						}
					}

				} else {

					for (var i = 0; i < models.length; i++) {

						if (models[i].Trained) {

							var machine = new SupportVectorMachine();
							
							machine.Initialize(
								models[i].ModelX,
								models[i].ModelY,
								models[i].Type,
								models[i].KernelParam,
								models[i].Alpha,
								models[i].B,
								models[i].W,
								models[i].MaxIterations,
								models[i].C,
								models[i].Category
							);
							
							for (var item = 0; item < input.length; item += 100) {

								var p = machine.Predict(input.slice(item, item + 100));

								for (var y = 0; y < p.length; y++) {

									if (p[y][0] > prediction[item + y][0]) {

										prediction[item + y][0] = p[y][0];

										classification[item + y][0] = p[y][0] >= threshold ? models[i].Category : 0;
									}
								}

								var ClassifierProgress = (i * input.length + item)/(models.length * input.length);
								
								notify({ClassifierProgress: ClassifierProgress});
							}
						}
					}
				}
				
				complete({classification: classification, prediction: prediction});
			}

			if (!$scope.Training && $scope.Samples > 0 && $scope.Inputs > 0 && $scope.TestData.length > 0 && $scope.Models != undefined) {
				
				$scope.ClassifierProgress = 0.0;

				var currentPath = document.URL;
				
				// mark this worker as one that supports async notifications
				$scope.asyncClassifier = Webworker.create(async, { async: true });

				// uses the native $q style notification: https://docs.angularjs.org/api/ng/service/$q
				$scope.asyncClassifier.run(currentPath, $scope.TestData, $scope.Models, $scope.SelectedModel, $scope.Threshold).then(function(result) {
					
					// promise is resolved

					$scope.classificationResult = '';
					
					if (result.classification != undefined) {
						
						$scope.Classification = result.classification;
						
						for(var i = 0; i < $scope.Classification.length; i++) {
							
							if (i > 0) {
								
								$scope.classificationResult += '\n';
							}
							
							$scope.classificationResult += $scope.Classification[i][0].toString();
						}
					}
					
					if (result.prediction != undefined) {
						
						$scope.Prediction = result.prediction;
					}
					
					$scope.ClassifierProgress = 1.0;

					d3.select("#plot").selectAll("*").remove();

				}, null, function(progress) {

					$scope.ClassifierProgress = progress.ClassifierProgress;
					
				}).catch(function(oError) {
					
					$scope.asyncClassifier = null;
					
				});
			}
		}

		// https://stackoverflow.com/questions/26320525/prettify-json-data-in-textarea-input/26324037
		$scope.PrettyPrint = function(json) {
	
			return JSON.stringify(json, undefined, 4);
		}
		
		// copy model parameters
		$scope.DisplayModelParameters = function() {

			if ($scope.SelectedModel > 0 && $scope.SelectedModel <= $scope.Models.length) {

				var machine = $scope.Models[$scope.SelectedModel - 1];

				if (machine.Trained) {
					
					var WW = [];
			
					for (var y = 0; y < machine.W.length; y++) {

						WW.push(machine.W[y][0]);
					}

					var parameters = {
						
						ModelX: machine.ModelX,
						ModelY: machine.ModelY,
						Type: machine.Type,
						KernelParam: machine.KernelParam,
						W: WW,
						B: machine.B,
						C: machine.C,
						Tolerance: machine.Tolerance,
						Category: machine.Category,
						Passes: machine.Iterations,
						Iterations: machine.Iterations,
						MaxIterations: machine.MaxIterations,
						Trained: machine.Trained
					};

					$scope.modelParameters = $scope.PrettyPrint(parameters);
				}
			}
		}

		$scope.SaveModels = function() {
			
			if ($scope.Models != undefined && $scope.Normalization.length > 1) {
				
				var models = [];

				for (var i = 0; i < $scope.Models.length; i++) {
					
					var machine = $scope.Models[i];

					if (machine.Trained) {
						
						var WW = [];
						
						for (var y = 0; y < machine.W.length; y++) {
							
							WW.push(machine.W[y][0]);
						}

						var parameters = {
							ModelX: machine.ModelX,
							ModelY: machine.ModelY,
							Type: machine.Type,
							KernelParam: machine.KernelParam,
							Alpha: machine.Alpha,
							W: WW,
							B: machine.B,
							C: machine.C,
							Tolerance: machine.Tolerance,
							Category: machine.Category,
							Passes: machine.Iterations,
							Iterations: machine.Iterations,
							MaxIterations: machine.MaxIterations,
							Trained: machine.Trained
						};

						models.push(parameters);
					}
				}

				var json = { Models: models, Normalization: $scope.Normalization };
				var jsonString = JSON.stringify(json);
				
				var blob = new Blob([jsonString], {
					
					type: "application/json"
					
				});
				
				FileSaver.saveAs(blob, "Models.json");
			}
		}

		$scope.LoadSVM = function() {

			$scope.Models = [];
			$scope.Inputs = 0;
			$scope.Categories = 0;
			$scope.SelectedModel = 0;

			var reader = new FileReader();

			reader.onload = function(progressEvent) {

				$scope.$apply(function() {
					
					var json = JSON.parse(reader.result);
					
					if (json.Models != undefined && json.Normalization != undefined) {
						
						$scope.Normalization = json.Normalization;
						$scope.Inputs = json.Models[0].ModelX[0].length;
						
						for (var i = 0; i < json.Models.length; i++) {

							var machine = json.Models[i];

							var WW = [];

							$scope.Categories = Math.max($scope.Categories, machine.Category);
							
							for (var y = 0; y < machine.W.length; y++) {
						
								WW.push([machine.W[y]]);
							}

							var parameters = {
								
								index: i + 1,
								ModelX: machine.ModelX,
								ModelY: machine.ModelY,
								Type: machine.Type,
								KernelParam: machine.KernelParam,
								Alpha: machine.Alpha,
								W: WW,
								B: machine.B,
								C: machine.C,
								Tolerance: machine.Tolerance,
								Category: machine.Category,
								Passes: machine.Iterations,
								Iterations: machine.Iterations,
								MaxIterations: machine.MaxIterations,
								Trained: machine.Trained
							};

							$scope.Models.push(parameters);
						}
					}
				});
			}

			if ($scope.NetworkFile.name != undefined) {
				
				reader.readAsText($scope.NetworkFile);
			}
		}

		$scope.RenderTestData = function() {
			
			if ($scope.TestData.length > 0 && $scope.Classification.length > 0 && $scope.Classification.length ==  $scope.TestData.length) {
				
				function generatePointsData(test, classification) {
					
					var data = [];
					var n = test.length;
					
					var minx = Number.MAX_VALUE;
					var maxx = Number.MIN_VALUE;
		
					var miny = Number.MAX_VALUE;
					var maxy = Number.MIN_VALUE;
					
					var f1 = 0;
					var f2 = 1;
		
					for (var i = 0; i < n; i++) {

						minx = Math.min(test[i][f1], minx);
						maxx = Math.max(test[i][f1], maxx);
		
						miny = Math.min(test[i][f2], miny);
						maxy = Math.max(test[i][f2], maxy);
					}

					var deltax = (maxx - minx) / 200;
					var deltay = (maxy - miny) / 200;
					
					minx = minx - 8 * deltax;
					maxx = maxx + 8 * deltax;
					miny = miny - 8 * deltay;
					maxy = maxy + 8 * deltay;

					deltax = (maxx - minx) / 200;
					deltay = (maxy - miny) / 200;

					for (i = 0; i < n; i++) {

						var dataPoint = {};
						
						dataPoint["x"] = (test[i][f1] - minx) / deltax;
						dataPoint["y"] = (test[i][f2] - miny) / deltay;						
						dataPoint["color"] = classification[i];
						
						data.push(dataPoint);
					}

					return data;
				}

				// modified scatter plot example - https://bl.ocks.org/aleereza/d2be3d62a09360a770b79f4e5527eea8
				var width = $scope.PlotWidth, height = $scope.PlotHeight;

				var svg = d3.select("#plot")
					.attr("width", width)
					.attr("height", height);

				svg.selectAll("*").remove();

				// create scale objects
				var xScale = d3.scaleLinear()
					.domain([0, 200])
					.range([0.1 * width, 0.8 * width]);
			  
				var yScale = d3.scaleLinear()
					.domain([0, 200])
					.range([0.8 * height, 0.1 * height]);

				var color = d3.scaleOrdinal().domain([0, d3.schemeCategory10.length - 1]).range(d3.schemeCategory10);

				// draw data points
				var points_g = svg.append("g")
					.classed("points_g", true);
				
				data = generatePointsData($scope.TestData, $scope.Classification);
				
				var points = points_g.selectAll("circle").data(data);

				points = points.enter().append("circle")
					.attr('cx', function(d) {return xScale(d.x)})
              		.attr('cy', function(d) {return yScale(d.y)})
              		.attr('r', 5)
              		.style("fill", function(d) { return color(parseInt(d.color))});

				// draw boundaries
				svg.append("line").attr("x1", 0.1 * width).attr("y1", 0.1 * height).attr("x2", 0.8 * width).attr("y2", 0.1 * height).attr("stroke-width", 1.0).attr("stroke", "#000000");
				svg.append("line").attr("x1", 0.1 * width).attr("y1", 0.8 * height).attr("x2", 0.8 * width).attr("y2", 0.8 * height).attr("stroke-width", 1.0).attr("stroke", "#000000");
				svg.append("line").attr("x1", 0.1 * width).attr("y1", 0.1 * height).attr("x2", 0.1 * width).attr("y2", 0.8 * height).attr("stroke-width", 1.0).attr("stroke", "#000000");
				svg.append("line").attr("x1", 0.8 * width).attr("y1", 0.1 * height).attr("x2", 0.8 * width).attr("y2", 0.8 * height).attr("stroke-width", 1.0).attr("stroke", "#000000");
					  
				// draw line on svg container
				function AddLine(graph, x1, y1, x2, y2, z) {

					graph.append("line")
						.attr("x1", xScale(x1))
						.attr("y1", yScale(y1))
						.attr("x2", xScale(x2))
						.attr("y2", yScale(y2))
						.attr("stroke-width", 1.0)
						.attr("stroke", color(z));
				}

				function ContourLines(graph, lines) {

					if (lines.length > 0) {

						for (var i = 0; i < lines.length; i++)
							AddLine(graph, lines[i].x1, lines[i].y1, lines[i].x2, lines[i].y2, lines[i].z);
					}
				}

				// function that will become a worker
				function async(currentPath, input, models, selected, threshold) {

					function generateMesh(x, width, height) {

						var m = x.length;
						
						var xplot = new Array(width);
						var yplot = new Array(height);
	
						var minx = Number.MAX_VALUE;
						var maxx = Number.MIN_VALUE;
			
						var miny = Number.MAX_VALUE;
						var maxy = Number.MIN_VALUE;
						
						var f1 = 0;
						var f2 = 1;
			
						for (var i = 0; i < m; i++) {
	
							minx = Math.min(x[i][f1], minx);
							maxx = Math.max(x[i][f1], maxx);
			
							miny = Math.min(x[i][f2], miny);
							maxy = Math.max(x[i][f2], maxy);
						}
			
						var deltax = (maxx - minx) / width;
						var deltay = (maxy - miny) / height;
						
						minx = minx - 8 * deltax;
						maxx = maxx + 8 * deltax;
						miny = miny - 8 * deltay;
						maxy = maxy + 8 * deltay;

						deltax = (maxx - minx) / width;
						deltay = (maxy - miny) / height;
			
						for (var j = 0; j < width; j++) {
	
							xplot[j] = minx + j * deltax;
						}
			
						for (var i = 0; i < height; i++) {
	
							yplot[i] = miny + i * deltay;
						}
			
						var xx = [];
			
						for (var i = 0; i < height; i++) {
	
							for (var j = 0; j < width; j++) {
								
								xx.push([xplot[j], yplot[i]]);
							}
						}
	
						return {mesh: xx, xplot: xplot, yplot: yplot, minx: minx, miny: miny, deltax: deltax, deltay: deltay};
					}
					
					// see: https://www.dashingd3js.com/svg-basic-shapes-and-d3js
					/// <summary>
					/// Renderer delegate
					/// </summary>
					/// <param name="graph">SVG container</param>
					/// <param name="x1">Start point x-coordinate</param>
					/// <param name="y1">Start point y-coordinate</param>
					/// <param name="x2">End point x-coordinate</param>
					/// <param name="y2">End point y-coordinate</param>
					/// <param name="z">Contour level</param>
					function line(graph, x1, y1, x2, y2, z) {

						graph.push({x1: x1, y1: y1, x2: x2, y2: y2, z: z});
					}

					/// <summary>
					/// Provides functionality to create contours from a triangular mesh.
					/// </summary>
					/// <remarks><para>
					/// Ported from C / Fortran code by Paul Bourke.
					/// See <a href="http://paulbourke.net/papers/conrec/">Conrec</a> for
					/// full description of code and the original source.
					/// </para>
					/// <para>
					/// Contouring aids in visualizing three dimensional surfaces on a two dimensional
					/// medium (on paper or in this case a computer graphics screen). Two most common
					/// applications are displaying topological features of an area on a map or the air
					/// pressure on a weather map. In all cases some parameter is plotted as a function
					/// of two variables, the longitude and latitude or x and y axis. One problem with
					/// computer contouring is the process is usually CPU intensive and the algorithms
					/// often use advanced mathematical techniques making them susceptible to error.
					/// </para></remarks>
					///
					/// Converted to JavaScript by sdsepara (2019)
					function Contour(graph, d, x, y, z, renderer) {
						
						var minColor = Math.abs(Math.min.apply(null, z));
						var x1 = 0;
						var x2 = 0;
						var y1 = 0;
						var y2 = 0;
			
						var h = new Array(5);
						var sh = new Array(5);
						var xh = new Array(5);
						var yh = new Array(5);
			
						var ilb = 0;
						var iub = d.length - 1;
						var jlb = 0;
						var jub = d[0].length - 1;
						var nc = z.length;
			
						// The indexing of im and jm should be noted as it has to start from zero
						// unlike the fortran counter part
						var im = [ 0, 1, 1, 0 ];
						var jm = [ 0, 0, 1, 1 ];
			
						// Note that castab is arranged differently from the FORTRAN code because
						// Fortran and C/C++ arrays are transposed of each other, in this case
						// it is more tricky as castab is in 3 dimension
						var castab = [
							[ [ 0, 0, 8 ], [ 0, 2, 5 ], [ 7, 6, 9 ] ], [ [ 0, 3, 4 ], [ 1, 3, 1 ], [ 4, 3, 0 ] ],
							[ [ 9, 6, 7 ], [ 5, 2, 0 ], [ 8, 0, 0 ] ]
						];

						xsect = function(p1, p2) { return ((h[p2] * xh[p1]) - (h[p1] * xh[p2])) / (h[p2] - h[p1]); };
						ysect = function(p1, p2) { return ((h[p2] * yh[p1]) - (h[p1] * yh[p2])) / (h[p2] - h[p1]); };
			
						for (var j = jub - 1; j >= jlb; j--) {

							for (var i = ilb; i <= iub - 1; i++) {

								var temp1 = Math.min(d[i][j], d[i][j + 1]);
								var temp2 = Math.min(d[i + 1][j], d[i + 1][j + 1]);
								var dmin = Math.min(temp1, temp2);
								
								temp1 = Math.max(d[i][j], d[i][j + 1]);
								temp2 = Math.max(d[i + 1][j], d[i + 1][j + 1]);
								var dmax = Math.max(temp1, temp2);
			
								if (dmax >= z[0] && dmin <= z[nc - 1]) {
									
									var k;

									for (k = 0; k < nc; k++) {

										if (z[k] >= dmin && z[k] <= dmax) {

											var m;
											
											for (m = 4; m >= 0; m--) {

												if (m > 0) {

													// The indexing of im and jm should be noted as it has to
													// start from zero
													h[m] = d[i + im[m - 1]][j + jm[m - 1]] - z[k];
													xh[m] = x[i + im[m - 1]];
													yh[m] = y[j + jm[m - 1]];

												} else {

													h[0] = 0.25 * (h[1] + h[2] + h[3] + h[4]);
													xh[0] = 0.5 * (x[i] + x[i + 1]);
													yh[0] = 0.5 * (y[j] + y[j + 1]);
												}
			
												if (h[m] > 0) {
													
													sh[m] = 1;

												} else if (h[m] < 0) {

													sh[m] = -1;
												
												} else {

													sh[m] = 0;
												}
											}
			
											//// Note: at this stage the relative heights of the corners and the
											//// centre are in the h array, and the corresponding coordinates are
											//// in the xh and yh arrays. The centre of the box is indexed by 0
											//// and the 4 corners by 1 to 4 as shown below.
											//// Each triangle is then indexed by the parameter m, and the 3
											//// vertices of each triangle are indexed by parameters m1,m2,and
											//// m3.
											//// It is assumed that the centre of the box is always vertex 2
											//// though this isimportant only when all 3 vertices lie exactly on
											//// the same contour level, in which case only the side of the box
											//// is drawn.
											////
											//// vertex 4 +-------------------+ vertex 3
											////          | \               / |
											////          |   \    m-3    /   |
											////          |     \       /     |
											////          |       \   /       |
											////          |  m=2    X   m=2   |       the centre is vertex 0
											////          |       /   \       |
											////          |     /       \     |
											////          |   /    m=1    \   |
											////          | /               \ |
											//// vertex 1 +-------------------+ vertex 2
			
											// Scan each triangle in the box
											for (m = 1; m <= 4; m++) {

												var m1 = m;
												var m2 = 0;
												var m3;
												
												if (m != 4) {

													m3 = m + 1;
												
												} else {

													m3 = 1;
												}
			
												var caseValue = castab[sh[m1] + 1][sh[m2] + 1][sh[m3] + 1];
			
												if (caseValue != 0) {

													switch (caseValue) {

														case 1: // Line between vertices 1 and 2
															x1 = xh[m1];
															y1 = yh[m1];
															x2 = xh[m2];
															y2 = yh[m2];
															break;
														case 2: // Line between vertices 2 and 3
															x1 = xh[m2];
															y1 = yh[m2];
															x2 = xh[m3];
															y2 = yh[m3];
															break;
														case 3: // Line between vertices 3 and 1
															x1 = xh[m3];
															y1 = yh[m3];
															x2 = xh[m1];
															y2 = yh[m1];
															break;
														case 4: // Line between vertex 1 and side 2-3
															x1 = xh[m1];
															y1 = yh[m1];
															x2 = xsect(m2, m3);
															y2 = ysect(m2, m3);
															break;
														case 5: // Line between vertex 2 and side 3-1
															x1 = xh[m2];
															y1 = yh[m2];
															x2 = xsect(m3, m1);
															y2 = ysect(m3, m1);
															break;
														case 6: // Line between vertex 3 and side 1-2
															x1 = xh[m3];
															y1 = yh[m3];
															x2 = xsect(m1, m2);
															y2 = ysect(m1, m2);
															break;
														case 7: // Line between sides 1-2 and 2-3
															x1 = xsect(m1, m2);
															y1 = ysect(m1, m2);
															x2 = xsect(m2, m3);
															y2 = ysect(m2, m3);
															break;
														case 8: // Line between sides 2-3 and 3-1
															x1 = xsect(m2, m3);
															y1 = ysect(m2, m3);
															x2 = xsect(m3, m1);
															y2 = ysect(m3, m1);
															break;
														case 9: // Line between sides 3-1 and 1-2
															x1 = xsect(m3, m1);
															y1 = ysect(m3, m1);
															x2 = xsect(m1, m2);
															y2 = ysect(m1, m2);
															break;
													}
			
													renderer(graph, y1, x1, y2, x2, minColor + z[k]);
												}
											}
										}
									}
								}

								var ClassifierProgress = 0.5 + 0.5 * (((jub - j - 1) * (iub + 1) + i) / ((jub + 1) * (iub + 1))); 

								notify({ClassifierProgress: ClassifierProgress});
							}
						}
					}

					// generate mesh and classify
					var meshResults = generateMesh(input, 200, 200);
					var mesh = meshResults.mesh;
					var xplot = meshResults.xplot;
					var yplot = meshResults.yplot;
					var minx = meshResults.minx;
					var miny = meshResults.miny;
					var deltax = meshResults.deltax;
					var deltay = meshResults.deltay;

					importScripts(currentPath + "js/Models.js");

					var prediction = Matrix.Create(mesh.length, 1);
					Matrix.Set(prediction, -1); // set to negative example by default

					for (var i = 0; i < models.length; i++) {

						if (selected != 0 && (selected - 1) != i)
							continue;

						if (models[i].Trained) {

							var machine = new SupportVectorMachine();
							
							machine.Initialize(
								models[i].ModelX,
								models[i].ModelY,
								models[i].Type,
								models[i].KernelParam,
								models[i].Alpha,
								models[i].B,
								models[i].W,
								models[i].MaxIterations,
								models[i].C,
								models[i].Category
							);
							
							for (var item = 0; item < mesh.length; item += 100) {

								var p = machine.Predict(mesh.slice(item, item + 100));

								for (var y = 0; y < p.length; y++) {
									
									if (selected != 0 && (selected - 1) == i) {
										
										prediction[item + y][0] = p[y][0];

									} else {
									
										if (p[y][0] > prediction[item + y][0]) {

											prediction[item + y][0] = p[y][0];
										}
									}
								}

								var ClassifierProgress = (i * mesh.length + item)/(models.length * mesh.length) * 0.25;
								
								notify({ClassifierProgress: ClassifierProgress});
							}
						}
					}

					var ii = 0;
							
					var data = new Array(yplot.length);

					for (var y = 0; y < yplot.length; y++) {
						
						data[y] = new Array(xplot.length)								
						
						yplot[y] = (yplot[y] - miny) / deltay;

						for (var x = 0; x < xplot.length; x++) {

							if (y == 0) {

								xplot[x] = (xplot[x] - minx) / deltax;
							}
							
							if (ii >= 0 && ii < prediction.length) {

								data[y][x] = prediction[ii];

								var ClassifierProgress = 0.25 + (ii / prediction.length) * 0.25; 

								notify({ClassifierProgress: ClassifierProgress});
							}
								
							ii ++;

						}
					}

					var lines = [];

					Contour(lines, data, xplot, yplot, [-1.0, 0.0, 1.0], line);

					complete({lines: lines});
				}

				if (!$scope.Training && $scope.TestData.length > 0 && $scope.Models != undefined && $scope.plotContours) {
				
					$scope.ClassifierProgress = 0.0;

					var currentPath = document.URL;
					
					// mark this worker as one that supports async notifications
					$scope.asyncPlotter = Webworker.create(async, { async: true });
				
					// uses the native $q style notification: https://docs.angularjs.org/api/ng/service/$q
					$scope.asyncPlotter.run(currentPath, $scope.TestData, $scope.Models, $scope.SelectedModel, $scope.Threshold).then(function(result) {
						
						$scope.ClassifierProgress = 1.0;

						// promise is resolved
						if (result.lines != undefined) {
							
							var contourLines = result.lines;

							ContourLines(svg, contourLines);
						}
						
					}, null, function(progress) {
						
						$scope.ClassifierProgress = progress.ClassifierProgress;

					}).catch(function(oError) {
						
						$scope.asyncPlotter = null;
						
					});
				}
			}
		}
		
		$scope.SaveRenderedData = function() {
			
			var svg = $("#plot")[0].innerHTML;
			
			if (svg != undefined) {
			
				svg = "<svg>" + svg + "</svg>";
				
				// add name spaces

				if(!svg.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
					
					svg = svg.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
				}
			
				if(!svg.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
					
					svg = svg.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="' + $scope.PlotWidth.toString() + 'px" height="' + $scope.PlotHeight.toString() + 'px"');
				}

				var blob = new Blob([svg], {
					
					type: "image/svg+xml;charset=utf-8"
					
				});
				
				FileSaver.saveAs(blob, "Classification.svg");
			}
		}

	}]).directive("inputBind", function() {
		
		return function(scope, elm, attrs) {
			
			elm.bind("change", function(evt) {
				
				scope.$apply(function(scope) {
					
					scope[ attrs.name ] = evt.target.files;
					scope['Items'] = 0;
					scope['Categories'] = 0;
					scope['Inputs'] = 0;
					scope['SelectedFile'] = evt.target.files[0];
				});
			});
		};
		
	}).directive("testBind", function() {
		
		return function(scope, elm, attrs) {
			
			elm.bind("change", function(evt) {
				
				scope.$apply(function(scope) {
					
					scope[ attrs.name ] = evt.target.files;
					scope['Samples'] = 0;
					scope['TestFile'] = evt.target.files[0];
				});
			});
		};

	}).directive("networkBind", function() {
		
		return function( scope, elm, attrs ) {
			
			elm.bind("change", function( evt ) {
				
				scope.$apply(function( scope ) {
					
					scope[ attrs.name ] = evt.target.files;
					scope['NetworkFile'] = evt.target.files[0];
				});
			});
		};
	});
