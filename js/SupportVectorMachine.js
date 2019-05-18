angular.module('d3', []).factory('d3Service', [function(){ return d3; }]);
  
angular
	.module('DeepLearning', ['ngWebworker', 'ngFileSaver', 'd3'])
	.controller('SupportVectorMachineController', ['$scope', 'Webworker', 'FileSaver', 'Blob', function($scope, Webworker, FileSaver, Blob) {
		
		class ModelParameters {

			constructor(id, type, parameters, regularization, passes, tolerance, category) {

				this.index = id;
				this.Type = type;
				this.Parameters = parameters;
				this.Regularization = regularization;
				this.Passes = passes;
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

		$scope.Training = true;
		$scope.TrainingProgress = 0;

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

				console.log('found: ' + found.toString());
				
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

					console.log($scope.Models);
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
				
					$scope.bias = current.Parameters[0];
					$scope.exponent = current.Parameters[1];
				
				} else if (current.Type == $scope.KernelType.Gaussian || current.Type == $scope.KernelType.Radial) {

					$scope.sigma = current.Parameters[0];

				} else if (current.Type == $scope.KernelType.Sigmoid || current.Type == $scope.KernelType.Linear) {
				
					$scope.slope = current.Parameters[0];
					$scope.intercept = current.Parameters[1];

				} else if (current.Type == $scope.KernelType.Fourier) {
				
					$scope.scalingFactor = current.Parameters[0];
				}

				$scope.passes = current.Passes;
				$scope.regularization = current.Regularization;
				$scope.tolerance = current.Tolerance; 				
				$scope.category = current.Category;
			}
		}

		// remove model from list
		$scope.RemoveModel = function() {

			if ($scope.SelectedModel > 0 && $scope.SelectedModel <= $scope.Models.length) {

				console.log("Remove Model: " + $scope.SelectedModel.toString());
				
				for (var i = 0; i < $scope.Models.length; i++) {
					
					if ($scope.Models[i].index == $scope.SelectedModel) {
						
						$scope.Models.splice(i, 1);

						break;
					}
				}

				$scope.RenumberModels();

				$scope.SelectedModel = 0;

				console.log($scope.Models);
			}
		};

		$scope.UpdateModel = function() {

			var current = $scope.SelectedModel - 1;

			if (current >= 0 && current < $scope.Models.length) {

				console.log("Update Model: " + (current + 1).toString());

				$scope.Models[current].Type == $scope.SelectedKernel;

				if ($scope.SelectedKernel == $scope.KernelType.Polynomial) {

					$scope.Models[current].Parameters = [$scope.bias, $scope.exponent];
				
				} else if ($scope.SelectedKernel == $scope.KernelType.Gaussian || $scope.SelectedKernel == $scope.KernelType.Radial) {

					$scope.Models[current].Parameters = [$scope.sigma];

				} else if ($scope.SelectedKernel == $scope.KernelType.Sigmoid || $scope.SelectedKernel == $scope.KernelType.Linear) {

					$scope.Models[current].Parameters = [$scope.slope, $scope.intercept];

				} else if ($scope.SelectedKernel == $scope.KernelType.Fourier) {

					$scope.Models[current].Parameters = [$scope.scalingFactor];
				}

				$scope.Models[current].Passes = $scope.passes;
				$scope.Models[current].Regularization = $scope.regularization;
				$scope.Models[current].Tolerance = $scope.tolerance; 				
				$scope.Models[current].Category = $scope.category;
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
