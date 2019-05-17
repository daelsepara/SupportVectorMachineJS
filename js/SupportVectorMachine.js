angular.module('d3', []).factory('d3Service', [function(){ return d3; }]);
  
angular
	.module('DeepLearning', ['ngWebworker', 'ngFileSaver', 'd3'])
	.controller('SupportVectorMachineController', ['$scope', 'Webworker', 'FileSaver', 'Blob', function($scope, Webworker, FileSaver, Blob) {
		
		class ModelParameters {

			constructor(id, type, parameters, regularization, passes, tolerance) {
				this.index = id;
				this.Type = type;
				this.Parameters = parameters;
				this.Regularization = regularization;
				this.Passes = passes;
				this.Tolerance = tolerance;
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
		$scope.category = 1;
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

		$scope.AddModel = function() {

			//console.log($scope.KernelNames[$scope.SelectedKernel] + " " + $scope.SelectedKernel.toString());

			var model = undefined;

			if ($scope.SelectedKernel == $scope.KernelType.Polynomial) {

				var model = new ModelParameters($scope.Models.length + 1, $scope.KernelType.Polynomial, [$scope.bias, $scope.exponent], $scope.regularization, $scope.passes, $scope.tolerance);
			}

			if (model != undefined) {
				
				$scope.Models.push(model);
			}

			//console.log("Model Parameters");
			//console.log(model);

			console.log($scope.Models);
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
