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
		};

		$scope.Models = [];
		$scope.Classification = [];
		$scope.Prediction = [];
		
		$scope.TrainingData = [];
		$scope.Output = [];
		$scope.Inputs = 0;
		$scope.Categories = 0;
		$scope.Items = 0;

		$scope.Training = false;
		$scope.TrainingProgress = 0;
		$scope.ClassifierProgress = 0;
		$scope.asyncTrainer = undefined;
		$scope.asyncClassifier = undefined;

		$scope.SelectedFile = {};
		$scope.TestFile = {};
		$scope.ModelFile = {};
		
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

			reader.onload = function(progressEvent) {

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
		};

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
		};

		// re-number index numbers (after deletion)
		$scope.RenumberModels = function() {

			for (var i = 0; i < $scope.Models.length; i++) {
					
				$scope.Models[i].index = i + 1;
			}
		};

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
		};

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
		};

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
		};

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
				
				complete({models: svms});
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
		};

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
	}).directive("modelBind", function() {
		
		return function(scope, elm, attrs) {
			
			elm.bind("change", function(evt) {
				
				scope.$apply(function(scope) {
					
					scope[ attrs.name ] = evt.target.files;
					scope['ModelFile'] = evt.target.files[0];
				});
			});
		};
	});
