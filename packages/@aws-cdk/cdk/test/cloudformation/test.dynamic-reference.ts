import { Test } from 'nodeunit';
import { DynamicReference, DynamicReferenceService, resolve, Stack } from '../../lib';

export = {
  'can create dynamic references with service and key with colons'(test: Test) {

    class TestStack extends Stack {
      constructor() {
        super();

        // WHEN
        const ref = new DynamicReference('Ref', {
          service: DynamicReferenceService.Ssm,
          referenceKey: 'a:b:c',
        });

        // THEN
        test.equal(resolve(ref.value), '{{resolve:ssm:a:b:c}}');
      }
    }

    new TestStack();
    test.done();
  },
};
