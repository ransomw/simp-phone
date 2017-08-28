import unittest

def load_tests_from_modules(
        test_modules, loader, standard_tests, pattern):
    if pattern == __name__:
        pattern = None
    suite = unittest.TestSuite()
    for testModule in test_modules:
        tests = (unittest.defaultTestLoader
                 .loadTestsFromModule(testModule, pattern=pattern))
        suite.addTests(tests)
    return suite

def load_tests_from_classes(
        module_name, test_classes,
        loader, tests, pattern):
    suite = unittest.TestSuite()
    if pattern is None:
        for test_class in test_classes:
            suite.addTests(loader.loadTestsFromTestCase(test_class))
    else:
        tests = loader.loadTestsFromName(pattern,
                                         module=module_name)
        failedTests = [t for t in tests._tests
                       if type(t) == unittest.loader._FailedTest]
        if len(failedTests) == 0:
            suite.addTests(tests)
    return suite
